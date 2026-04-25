import { useEffect, useMemo } from "react"
import type { UseFormClearErrors, UseFormSetError } from "react-hook-form"

interface UseBalanceCheckOptions {
  amountNumber: number
  accountId: string
  accountBalance: number | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError: UseFormSetError<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearErrors: UseFormClearErrors<any>
  fieldName?: string
  activeWhen?: boolean
  message?: string
}

interface UseBalanceCheckReturn {
  isInsufficient: boolean
  projectedBalance: number | null
}

export function useBalanceCheck({
  amountNumber,
  accountId,
  accountBalance,
  setError,
  clearErrors,
  fieldName = "amount",
  activeWhen = true,
  message = "Saldo tidak cukup.",
}: UseBalanceCheckOptions): UseBalanceCheckReturn {
  const isInsufficient = useMemo(() => {
    if (!activeWhen) return false
    if (!accountId) return false
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) return false
    if (accountBalance == null) return false
    return amountNumber > accountBalance
  }, [activeWhen, accountId, amountNumber, accountBalance])

  const projectedBalance = useMemo(() => {
    if (accountBalance == null) return null
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) return null
    return accountBalance - amountNumber
  }, [accountBalance, amountNumber])

  useEffect(() => {
    if (!activeWhen || !accountId || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      clearErrors(fieldName)
      return
    }
    if (accountBalance != null && amountNumber > accountBalance) {
      setError(fieldName, { type: "validate", message })
    } else {
      clearErrors(fieldName)
    }
  }, [amountNumber, accountId, accountBalance, activeWhen, fieldName, message, setError, clearErrors])

  return { isInsufficient, projectedBalance }
}
