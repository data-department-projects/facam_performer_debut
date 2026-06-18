import webpush from "web-push";

type PushPayload = {
  title: string;
  body: string;
  url: string;
};

type PushSubscriptionData = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

// Appelé à chaque envoi pour éviter un crash au chargement du module si les
// variables VAPID ne sont pas encore définies (build, tests, dev sans .env.local)
function configureVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    configureVapid();
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error("[lib/web-push]", error);
    return { success: false, error: String(error) };
  }
}
