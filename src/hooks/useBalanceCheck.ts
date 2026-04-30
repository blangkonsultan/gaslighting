import { useEffect, useMemo } from "react"
import type { UseFormClearErrors, UseFormSetError } from "react-hook-form"

interface UseBalanceCheckOptions {
  amountNumber: number
  accountId: string
  accountBalance: number | undefined
  editingAmount?: number
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
  editingAmount,
  setError,
  clearErrors,
  fieldName = "amount",
  activeWhen = true,
  message = "Saldo tidak cukup.",
}: UseBalanceCheckOptions): UseBalanceCheckReturn {
  const baseBalance = useMemo(() => {
    if (accountBalance == null) return null
    if (editingAmount != null && Number.isFinite(editingAmount) && editingAmount > 0) {
      return accountBalance + editingAmount
    }
    return accountBalance
  }, [accountBalance, editingAmount])

  const isInsufficient = useMemo(() => {
    if (!activeWhen) return false
    if (!accountId) return false
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) return false
    if (baseBalance == null) return false
    return amountNumber > baseBalance
  }, [activeWhen, accountId, amountNumber, baseBalance])

  const projectedBalance = useMemo(() => {
    if (baseBalance == null) return null
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) return null
    return baseBalance - amountNumber
  }, [baseBalance, amountNumber])

  useEffect(() => {
    if (!activeWhen || !accountId || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      clearErrors(fieldName)
      return
    }
    if (baseBalance != null && amountNumber > baseBalance) {
      setError(fieldName, { type: "validate", message })
    } else {
      clearErrors(fieldName)
    }
  }, [amountNumber, accountId, baseBalance, activeWhen, fieldName, message, setError, clearErrors])

  useEffect(() => {
    if (!activeWhen || !accountId || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      clearErrors(fieldName)
      return
    }
    if (baseBalance != null && amountNumber > baseBalance) {
      setError(fieldName, { type: "validate", message })
    } else {
      clearErrors(fieldName)
    }
  }, [amountNumber, accountId, baseBalance, activeWhen, fieldName, message, setError, clearErrors])

  return { isInsufficient, projectedBalance }
}
