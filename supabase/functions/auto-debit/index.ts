import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

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

function formatDateYmd(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayYmd(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
  const result = new Date(date)
  const originalDay = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  const maxDay = daysInMonthUtc(result.getFullYear(), result.getMonth() + 1)
  result.setDate(Math.min(originalDay, maxDay))
  return result
}

function computeNextDate(nextDate: Date | string, frequency: Frequency): string {
  const baseDate = nextDate instanceof Date ? nextDate : new Date(nextDate)
  let result: Date

  switch (frequency) {
    case 'daily':
      result = addDays(baseDate, 1)
      break
    case 'weekly':
      result = addDays(baseDate, 7)
      break
    case 'monthly':
      result = addMonths(baseDate, 1)
      break
    case 'yearly':
      result = addMonths(baseDate, 12)
      break
    default:
      return formatDateYmd(baseDate)
  }

  return formatDateYmd(result)
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

  // 1. Authenticate caller (require service role key)
  const authHeader = req.headers.get('Authorization')
  if (!serviceRoleKey || !authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
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
          continue
        }

        const typedAccount = account as Account
        if (typedAccount.balance < bill.amount) {
          results.errors.push({ billId: bill.id, billName: bill.name, error: 'Insufficient balance' })
          results.failed++
          await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id)
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
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        results.errors.push({ billId: bill.id, billName: bill.name, error: errorMsg })
        results.failed++
        await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id)
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
