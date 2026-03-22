import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID')!
const PLAID_SECRET = Deno.env.get('PLAID_SECRET')!
const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox'
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // Verify authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No auth token')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { public_token, institution } = await req.json()
    if (!public_token) throw new Error('Missing public_token')

    // Exchange public token for access token
    const exchangeRes = await fetch(`${PLAID_BASE}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token,
      }),
    })
    const exchangeData = await exchangeRes.json()
    if (exchangeData.error_code) throw new Error(exchangeData.error_message)

    const { access_token, item_id } = exchangeData

    // Store using service role (bypasses RLS)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Store access token in Vault
    const { data: vaultResult, error: vaultError } = await admin.rpc('store_plaid_token', {
      p_access_token: access_token,
      p_item_id: item_id,
    })
    if (vaultError) throw vaultError

    // Store connection with vault reference
    const { error: connError } = await admin.from('bank_connections').upsert({
      user_id: user.id,
      plaid_item_id: item_id,
      vault_secret_id: vaultResult,
      institution_id: institution?.institution_id || null,
      institution_name: institution?.name || null,
      status: 'active',
      error_code: null,
      error_message: null,
    }, { onConflict: 'plaid_item_id' })
    if (connError) throw connError

    // Get connection ID
    const { data: conn } = await admin.from('bank_connections')
      .select('id')
      .eq('plaid_item_id', item_id)
      .single()

    // Fetch accounts from Plaid
    const acctRes = await fetch(`${PLAID_BASE}/accounts/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token,
      }),
    })
    const acctData = await acctRes.json()
    if (acctData.error_code) throw new Error(acctData.error_message)

    // Store accounts
    for (const acct of acctData.accounts) {
      await admin.from('bank_accounts').upsert({
        user_id: user.id,
        connection_id: conn.id,
        plaid_account_id: acct.account_id,
        name: acct.name,
        official_name: acct.official_name,
        type: acct.type,
        subtype: acct.subtype,
        mask: acct.mask,
        current_balance: acct.balances.current,
        available_balance: acct.balances.available,
        currency_code: acct.balances.iso_currency_code || 'USD',
      }, { onConflict: 'plaid_account_id' })
    }

    // Initialize sync cursor
    await admin.from('bank_sync_cursors').upsert({
      connection_id: conn.id,
      cursor: '',
      sync_in_progress: false,
    }, { onConflict: 'connection_id' })

    // Fire-and-forget initial transaction sync (don't block response)
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/plaid-sync-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ connection_id: conn.id }),
    }).catch(() => {}) // swallow — sync will retry via webhook/cron

    return new Response(
      JSON.stringify({ success: true, accounts: acctData.accounts.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
