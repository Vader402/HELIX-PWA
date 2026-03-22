import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID')!
const PLAID_SECRET = Deno.env.get('PLAID_SECRET')!
const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox'
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`

// Verify Plaid webhook signature using their verification endpoint
async function verifyWebhook(req: Request, body: string): Promise<boolean> {
  const signedJwt = req.headers.get('Plaid-Verification')
  if (!signedJwt) return false

  try {
    // Get Plaid's webhook verification key
    const keyRes = await fetch(`${PLAID_BASE}/webhook_verification_key/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        key_id: extractKid(signedJwt),
      }),
    })
    const keyData = await keyRes.json()
    if (keyData.error_code) return false

    // Import the JWK and verify
    const jwk = keyData.key
    const key = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']
    )

    // Decode JWT parts
    const [headerB64, payloadB64, sigB64] = signedJwt.split('.')
    const sigBuf = base64UrlDecode(sigB64)
    const dataBuf = new TextEncoder().encode(`${headerB64}.${payloadB64}`)

    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, key, sigBuf, dataBuf
    )
    if (!valid) return false

    // Verify body hash matches
    const payload = JSON.parse(atob(payloadB64.replace(/-/g,'+').replace(/_/g,'/')))
    const bodyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body))
    const expectedHash = bufToHex(new Uint8Array(bodyHash))

    return payload.request_body_sha256 === expectedHash
  } catch {
    return false
  }
}

function extractKid(jwt: string): string {
  const header = JSON.parse(atob(jwt.split('.')[0].replace(/-/g,'+').replace(/_/g,'/')))
  return header.kid
}

function base64UrlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g,'+').replace(/_/g,'/') + '=='.slice(0, (4 - str.length % 4) % 4)
  const bin = atob(b64)
  return Uint8Array.from(bin, c => c.charCodeAt(0))
}

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2,'0')).join('')
}

serve(async (req) => {
  try {
    const bodyText = await req.text()

    // Verify webhook signature
    const isValid = await verifyWebhook(req, bodyText)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
    }

    const body = JSON.parse(bodyText)
    const { webhook_type, webhook_code, item_id, error } = body

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Look up connection by Plaid item_id
    const { data: conn } = await admin.from('bank_connections')
      .select('id')
      .eq('plaid_item_id', item_id)
      .single()

    if (!conn) {
      return new Response(JSON.stringify({ received: true }), { status: 200 })
    }

    if (webhook_type === 'TRANSACTIONS') {
      if (['SYNC_UPDATES_AVAILABLE', 'INITIAL_UPDATE', 'HISTORICAL_UPDATE', 'DEFAULT_UPDATE'].includes(webhook_code)) {
        // Fire-and-forget sync (lock prevents double-runs)
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/plaid-sync-transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ connection_id: conn.id }),
        }).catch(() => {})
      }
    }

    if (webhook_type === 'ITEM') {
      if (webhook_code === 'ERROR') {
        const newStatus = error?.error_code === 'ITEM_LOGIN_REQUIRED' ? 'pending_reauth' : 'error'
        await admin.from('bank_connections').update({
          status: newStatus,
          error_code: error?.error_code || 'UNKNOWN',
          error_message: error?.error_message || 'Unknown error',
        }).eq('id', conn.id)
      }
      if (webhook_code === 'PENDING_EXPIRATION') {
        await admin.from('bank_connections').update({
          status: 'expired',
          error_message: 'Consent expiring — re-link required',
        }).eq('id', conn.id)
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500 }
    )
  }
})
