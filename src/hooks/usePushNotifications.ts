import { useState, useEffect, useCallback } from "react"
import {
  savePushSubscription,
  deletePushSubscription,
  urlBase64ToUint8Array,
} from "@/services/push-notifications.service"

export type PushPermission = NotificationPermission | "unsupported"

export interface UsePushNotificationsReturn {
  isSupported: boolean
  permission: PushPermission
  isSubscribed: boolean
  isLoading: boolean
  isToggling: boolean
  error: string | null
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  toggleSubscription: (enable: boolean) => Promise<boolean>
}

export function usePushNotifications(userId: string): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<PushPermission>("unsupported")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSupport = useCallback(() => {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    )
  }, [])

  // Initialize and check current status
  useEffect(() => {
    let isMounted = true

    async function initStatus() {
      if (!checkSupport()) {
        if (isMounted) {
          setIsSupported(false)
          setPermission("unsupported")
          setIsSubscribed(false)
          setIsLoading(false)
        }
        return
      }

      const currentPermission = Notification.permission
      if (isMounted) {
        setIsSupported(true)
        setPermission(currentPermission)
      }

      if (!userId) {
        if (isMounted) setIsLoading(false)
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (isMounted) {
          setIsSubscribed(Boolean(subscription))
        }
      } catch (err) {
        console.error("Error checking push subscription:", err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initStatus()

    return () => {
      isMounted = false
    }
  }, [userId, checkSupport])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!checkSupport()) {
      setError("Push notification tidak didukung di browser ini.")
      return false
    }

    if (!userId) {
      setError("Pengguna belum terautentikasi.")
      return false
    }

    setIsToggling(true)
    setError(null)

    try {
      let currentPerm = Notification.permission
      if (currentPerm === "denied") {
        setError(
          "Izin notifikasi diblokir di browser. Harap aktifkan izin notifikasi pada pengaturan browser Anda."
        )
        return false
      }

      if (currentPerm === "default") {
        currentPerm = await Notification.requestPermission()
        setPermission(currentPerm)
      }

      if (currentPerm !== "granted") {
        setError("Izin notifikasi tidak diberikan.")
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        throw new Error("VAPID public key tidak ditemukan dalam konfigurasi.")
      }

      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
        })
      }

      await savePushSubscription(userId, subscription.toJSON())
      setIsSubscribed(true)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengaktifkan notifikasi."
      setError(msg)
      return false
    } finally {
      setIsToggling(false)
    }
  }, [checkSupport, userId])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!checkSupport()) return false

    setIsToggling(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await deletePushSubscription(subscription.endpoint)
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menonaktifkan notifikasi."
      setError(msg)
      return false
    } finally {
      setIsToggling(false)
    }
  }, [checkSupport])

  const toggleSubscription = useCallback(
    async (enable: boolean): Promise<boolean> => {
      if (enable) {
        return subscribe()
      } else {
        return unsubscribe()
      }
    },
    [subscribe, unsubscribe]
  )

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    isToggling,
    error,
    subscribe,
    unsubscribe,
    toggleSubscription,
  }
}
