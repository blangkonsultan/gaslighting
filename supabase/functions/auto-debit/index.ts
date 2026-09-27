import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

interface Bill {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  name: string
  amount: number
  type: string
  frequency: string
  next_date: string
  end_date: string | null
  description: string | null
  is_active: boolean
  status: string
}

interface Account {
  id: string
  user_id: string
  balance: number
}

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface PushSubscriptionRecord {
  id: string
  user_id: string
  endpoint: string
  keys_auth: string
  keys_p256dh: string
}

function formatIdr(amount: number): string {
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `Rp ${amount}`
  }
}

async function sendBillPushNotification(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    title: string
    body: string
    url?: string
  },
  hasVapid: boolean
) {
  if (!hasVapid) return

  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, keys_auth, keys_p256dh')
      .eq('user_id', userId)

    if (error || !subscriptions || subscriptions.length === 0) {
      return
    }

    const list = subscriptions as PushSubscriptionRecord[]
    const messageData = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      url: payload.url || '/transactions',
    })

    for (const sub of list) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.keys_auth,
              p256dh: sub.keys_p256dh,
            },
          },
          messageData
        )
      } catch (pushErr: unknown) {
        const errObj = pushErr as { statusCode?: number; status?: number; message?: string } | undefined
        console.error(`Push notification failed for endpoint ${sub.endpoint}:`, errObj?.message || String(pushErr))
        const statusCode = errObj?.statusCode || errObj?.status
        if (statusCode === 404 || statusCode === 410) {
          console.log(`Removing expired push subscription ${sub.id}`)
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }
  } catch (err) {
    console.error('Error dispatching push notifications:', err)
  }
}

function formatDateYmd(date: Date | string): string {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }
  const d = date instanceof Date ? date : new Date(date)
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)
  } catch {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
}

function todayYmd(timeZone = 'Asia/Jakarta'): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
}

function daysInMonthUtc(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate()
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function addMonths(date: Date, months: number): Date {
  const targetYear = date.getFullYear()
  const targetMonth = date.getMonth() + months
  const targetDay = date.getDate()
  const result = new Date(targetYear, targetMonth, 1)
  const maxDay = daysInMonthUtc(result.getFullYear(), result.getMonth() + 1)
  result.setDate(Math.min(targetDay, maxDay))
  return result
}

function computeNextDate(nextDate: Date | string, frequency: Frequency): string {
  const [year, month, day] = (typeof nextDate === 'string' ? nextDate : formatDateYmd(nextDate))
    .split('-')
    .map(Number)
  const d = new Date(year, month - 1, day)

  let next: Date
  switch (frequency) {
    case 'daily':
      next = addDays(d, 1)
      break
    case 'weekly':
      next = addDays(d, 7)
      break
    case 'monthly':
      next = addMonths(d, 1)
      break
    case 'yearly':
      next = addMonths(d, 12)
      break
    default:
      next = addMonths(d, 1)
  }

  return formatDateYmd(next)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const cronSecret = Deno.env.get('CRON_SECRET') ?? ''
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@gaslighting.com'

  const hasVapid = Boolean(vapidPublicKey && vapidPrivateKey)
  if (hasVapid) {
    try {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
    } catch (vErr) {
      console.error('Failed to set VAPID details:', vErr)
    }
  }

  // 1. Authenticate caller (require service role key or cron secret from env)
  const authHeader = req.headers.get('Authorization')
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : ''

  const isAuthorized = Boolean(
    token && (token === serviceRoleKey || (cronSecret && token === cronSecret))
  )

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const today = todayYmd()
  const results = {
    processed: 0,
    failed: 0,
    skipped: 0,
    errors: [] as Array<{ billId: string; billName: string; error: string }>,
  }

  try {
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('id, user_id, account_id, category_id, name, amount, type, frequency, next_date, end_date, description, is_active, status')
      .lte('next_date', today)
      .eq('is_active', true)
      .eq('status', 'active')
      .order('next_date', { ascending: true })

    if (billsError) {
      throw billsError
    }

    const billList = (bills ?? []) as Bill[]
    console.log(`Found ${billList.length} bills to process for ${today}`)

    for (const bill of billList) {
      try {
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id, user_id, balance')
          .eq('id', bill.account_id)
          .eq('user_id', bill.user_id)
          .single()

        if (accountError || !account) {
          results.errors.push({ billId: bill.id, billName: bill.name, error: 'Account not found' })
          results.failed++
          await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id)
          await sendBillPushNotification(
            supabase,
            bill.user_id,
            {
              title: 'Tagihan Auto-Debit Gagal',
              body: `Pembayaran ${bill.name} gagal: Rekening pembayaran tidak ditemukan.`,
            },
            hasVapid
          )
          continue
        }

        const typedAccount = account as Account
        if (typedAccount.balance < bill.amount) {
          results.errors.push({ billId: bill.id, billName: bill.name, error: 'Insufficient balance' })
          results.failed++
          await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id)
          await sendBillPushNotification(
            supabase,
            bill.user_id,
            {
              title: 'Tagihan Auto-Debit Gagal',
              body: `Pembayaran ${bill.name} sebesar ${formatIdr(bill.amount)} gagal: Saldo rekening tidak mencukupi.`,
            },
            hasVapid
          )
          continue
        }

        const description = bill.description || bill.name
        const transactionDate = formatDateYmd(bill.next_date)

        const { error: txError } = await supabase.from('transactions').insert({
          user_id: bill.user_id,
          account_id: bill.account_id,
          category_id: bill.category_id,
          type: 'expense',
          amount: bill.amount,
          description,
          transaction_date: transactionDate,
          is_recurring: true,
          bill_id: bill.id,
        })

        if (txError) {
          throw txError
        }

        const nextDate = computeNextDate(bill.next_date, bill.frequency as Frequency)
        let endDateReached = false
        if (bill.end_date) {
          const endDateStr = formatDateYmd(bill.end_date)
          endDateReached = nextDate > endDateStr
        }

        const { error: updateBillError } = await supabase
          .from('bills')
          .update({
            last_processed_at: new Date().toISOString(),
            next_date: nextDate,
            is_active: !endDateReached,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bill.id)

        if (updateBillError) {
          throw updateBillError
        }

        results.processed++
        console.log(`Processed bill: ${bill.name} (${bill.id}) - amount: ${bill.amount}, next_date: ${nextDate}`)
        await sendBillPushNotification(
          supabase,
          bill.user_id,
          {
            title: 'Tagihan Auto-Debit Berhasil',
            body: `Pembayaran ${bill.name} sebesar ${formatIdr(bill.amount)} berhasil diproses.`,
            url: '/transactions',
          },
          hasVapid
        )
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        results.errors.push({ billId: bill.id, billName: bill.name, error: errorMsg })
        results.failed++
        await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id)
        await sendBillPushNotification(
          supabase,
          bill.user_id,
          {
            title: 'Tagihan Auto-Debit Gagal',
            body: `Pembayaran ${bill.name} gagal: ${errorMsg}`,
          },
          hasVapid
        )
        console.error(`Failed to process bill ${bill.id}:`, errorMsg)
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Auto-debit processing error:', errorMsg)
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log('Auto-debit processing completed:', JSON.stringify(results))

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
