import { supabase } from "./supabase"

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export interface PushSubscriptionData {
  endpoint?: string | null
  keys?: {
    auth?: string
    p256dh?: string
  }
}

export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionData
): Promise<void> {
  const endpoint = subscription.endpoint
  const keysAuth = subscription.keys?.auth
  const keysP256dh = subscription.keys?.p256dh

  if (!endpoint || !keysAuth || !keysP256dh) {
    throw new Error("Data langganan notifikasi tidak valid")
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint,
      keys_auth: keysAuth,
      keys_p256dh: keysP256dh,
    },
    { onConflict: "endpoint" }
  )

  if (error) throw error
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)

  if (error) throw error
}

export async function checkPushSubscription(
  userId: string,
  endpoint: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}
