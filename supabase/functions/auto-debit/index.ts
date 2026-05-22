import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'

const DB_URL = Deno.env.get('SUPABASE_DB_URL')!

interface Bill {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  name: string
  amount: number
  type: string
  frequency: string
  next_date: Date | string
  end_date: Date | string | null
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
  result.setMonth(result.getMonth() + months)
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
    return new Response('Method not allowed', { status: 405 })
  }

  const sql = postgres(DB_URL)
  const today = new Date()

  const results = {
    processed: 0,
    failed: 0,
    skipped: 0,
    errors: [] as Array<{ billId: string; billName: string; error: string }>
  }

  try {
    const bills = await sql<Bill[]>`
      SELECT id, user_id, account_id, category_id, name, amount, type,
             frequency, next_date, end_date, description, is_active, status
      FROM bills
      WHERE next_date <= ${today}
        AND is_active = true
        AND status = 'active'
      ORDER BY next_date ASC
    `

    console.log(`Found ${bills.length} bills to process for ${todayYmd()}`)

    for (const bill of bills) {
      try {
        const account = await sql<Account[]>`
          SELECT id, user_id, balance
          FROM accounts
          WHERE id = ${bill.account_id}
            AND user_id = ${bill.user_id}
        `

        if (!account || account.length === 0) {
          results.errors.push({ billId: bill.id, billName: bill.name, error: 'Account not found' })
          results.failed++
          await sql`
            UPDATE bills
            SET status = 'failed'
            WHERE id = ${bill.id}
          `
          continue
        }

        if (account[0].balance < bill.amount) {
          results.errors.push({ billId: bill.id, billName: bill.name, error: 'Insufficient balance' })
          results.failed++
          await sql`
            UPDATE bills
            SET status = 'failed'
            WHERE id = ${bill.id}
          `
          continue
        }

        const description = bill.description || bill.name
        const transactionDate = bill.next_date instanceof Date ? bill.next_date : new Date(bill.next_date)

        await sql`
          INSERT INTO transactions (
            user_id, account_id, category_id, type, amount,
            description, transaction_date, is_recurring, bill_id
          ) VALUES (
            ${bill.user_id}, ${bill.account_id}, ${bill.category_id},
            'expense', ${bill.amount}, ${description}, ${transactionDate},
            true, ${bill.id}
          )
        `

        const nextDate = computeNextDate(bill.next_date, bill.frequency as Frequency)

        let endDateReached = false
        if (bill.end_date) {
          const endDate = bill.end_date instanceof Date ? bill.end_date : new Date(bill.end_date)
          endDateReached = new Date(nextDate) > endDate
        }

        await sql`
          UPDATE bills
          SET last_processed_at = NOW(),
              next_date = ${nextDate}::date,
              is_active = ${!endDateReached},
              updated_at = NOW()
          WHERE id = ${bill.id}
        `

        results.processed++
        console.log(`Processed bill: ${bill.name} (${bill.id}) - amount: ${bill.amount}, next_date: ${nextDate}`)

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        results.errors.push({ billId: bill.id, billName: bill.name, error: errorMsg })
        results.failed++
        await sql`
          UPDATE bills
          SET status = 'failed'
          WHERE id = ${bill.id}
        `
        console.error(`Failed to process bill ${bill.id}:`, errorMsg)
      }
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Auto-debit processing error:', errorMsg)
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  } finally {
    await sql.end()
  }

  console.log('Auto-debit processing completed:', JSON.stringify(results))

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})