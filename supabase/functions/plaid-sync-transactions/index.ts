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
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { connection_id } = await req.json()

    // If specific connection, sync just that one. Otherwise sync all active.
    let connections: any[]
    if (connection_id) {
      const { data } = await admin.from('bank_connections')
        .select('id, user_id, plaid_item_id, vault_secret_id')
        .eq('id', connection_id)
        .eq('status', 'active')
      connections = data || []
    } else {
      const { data } = await admin.from('bank_connections')
        .select('id, user_id, plaid_item_id, vault_secret_id')
        .eq('status', 'active')
      connections = data || []
    }

    let totalAdded = 0
    let totalModified = 0
    let totalRemoved = 0

    for (const conn of connections) {
      // Acquire sync lock (prevents concurrent syncs)
      const { data: locked } = await admin.rpc('acquire_sync_lock', {
        p_connection_id: conn.id,
      })
      if (!locked) continue // Another sync is already running

      try {
        // Get access token from Vault
        const { data: access_token } = await admin.rpc('get_plaid_token', {
          p_vault_secret_id: conn.vault_secret_id,
        })
        if (!access_token) throw new Error('Token not found in vault')

        // Get current cursor
        const { data: cursorRow } = await admin.from('bank_sync_cursors')
          .select('cursor')
          .eq('connection_id', conn.id)
          .single()

        let cursor = cursorRow?.cursor || ''
        let hasMore = true

        // Build account ID → UUID map
        const { data: accounts } = await admin.from('bank_accounts')
          .select('id, plaid_account_id')
          .eq('connection_id', conn.id)
        const acctMap: Record<string, string> = {}
        for (const a of (accounts || [])) {
          acctMap[a.plaid_account_id] = a.id
        }

        while (hasMore) {
          const syncRes = await fetch(`${PLAID_BASE}/transactions/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: PLAID_CLIENT_ID,
              secret: PLAID_SECRET,
              access_token,
              cursor,
              count: 500,
            }),
          })
          const syncData = await syncRes.json()
          if (syncData.error_code) {
            // Mark connection as errored
            await admin.from('bank_connections').update({
              status: syncData.error_code === 'ITEM_LOGIN_REQUIRED' ? 'pending_reauth' : 'error',
              error_code: syncData.error_code,
              error_message: syncData.error_message,
            }).eq('id', conn.id)
            break
          }

          // Process added transactions
          for (const txn of (syncData.added || [])) {
            const accountUuid = acctMap[txn.account_id]
            if (!accountUuid) continue

            await admin.from('bank_transactions').upsert({
              user_id: conn.user_id,
              account_id: accountUuid,
              plaid_transaction_id: txn.transaction_id,
              amount: txn.amount,
              currency_code: txn.iso_currency_code || 'USD',
              date: txn.date,
              authorized_date: txn.authorized_date,
              name: txn.name,
              merchant_name: txn.merchant_name,
              category: txn.category,
              pending: txn.pending,
              payment_channel: txn.payment_channel,
              transaction_type: txn.transaction_type,
            }, { onConflict: 'plaid_transaction_id' })
          }
          totalAdded += (syncData.added || []).length

          // Process modified transactions
          for (const txn of (syncData.modified || [])) {
            const accountUuid = acctMap[txn.account_id]
            if (!accountUuid) continue

            await admin.from('bank_transactions').upsert({
              user_id: conn.user_id,
              account_id: accountUuid,
              plaid_transaction_id: txn.transaction_id,
              amount: txn.amount,
              currency_code: txn.iso_currency_code || 'USD',
              date: txn.date,
              authorized_date: txn.authorized_date,
              name: txn.name,
              merchant_name: txn.merchant_name,
              category: txn.category,
              pending: txn.pending,
              payment_channel: txn.payment_channel,
              transaction_type: txn.transaction_type,
            }, { onConflict: 'plaid_transaction_id' })
          }
          totalModified += (syncData.modified || []).length

          // Process removed transactions
          for (const txn of (syncData.removed || [])) {
            await admin.from('bank_transactions')
              .delete()
              .eq('plaid_transaction_id', txn.transaction_id)
          }
          totalRemoved += (syncData.removed || []).length

          cursor = syncData.next_cursor
          hasMore = syncData.has_more
        }

        // Update balances
        const { data: access_token2 } = await admin.rpc('get_plaid_token', {
          p_vault_secret_id: conn.vault_secret_id,
        })
        const balRes = await fetch(`${PLAID_BASE}/accounts/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: PLAID_CLIENT_ID,
            secret: PLAID_SECRET,
            access_token: access_token2,
          }),
        })
        const balData = await balRes.json()
        if (!balData.error_code) {
          for (const acct of balData.accounts) {
            await admin.from('bank_accounts').update({
              current_balance: acct.balances.current,
              available_balance: acct.balances.available,
            }).eq('plaid_account_id', acct.account_id)
          }
        }

        // Release lock + save cursor
        await admin.rpc('release_sync_lock', {
          p_connection_id: conn.id,
          p_cursor: cursor,
        })
      } catch (syncErr) {
        // Release lock even on failure
        await admin.rpc('release_sync_lock', {
          p_connection_id: conn.id,
          p_cursor: '', // preserve existing cursor on error
        })
        throw syncErr
      }
    }

    return new Response(
      JSON.stringify({ success: true, added: totalAdded, modified: totalModified, removed: totalRemoved }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
