import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/web-push";
import { sendEmail, type EmailTemplate } from "@/lib/email";

type NotifyPayload = {
  title: string;
  body: string;
  url: string;
  // Utilisé uniquement si le fallback email est déclenché (push refusé ou absent)
  emailTemplate: EmailTemplate;
  emailData: Record<string, string>;
};

// Point d'entrée unique pour les notifications utilisateur (Invariant 17)
// Choisit automatiquement push ou email — jamais les deux pour un même événement
export async function notifyUser(
  userId: string,
  payload: NotifyPayload,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { pushSubscriptions: true },
  });

  if (!user) return;

  if (
    user.notificationConsent === "ACCEPTED" &&
    user.pushSubscriptions.length > 0
  ) {
    for (const sub of user.pushSubscriptions) {
      const result = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
        },
        { title: payload.title, body: payload.body, url: payload.url },
      );

      if (!result.success) {
        // Subscription invalide/expirée → suppression immédiate
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
    return;
  }

  // Fallback email — utilise le template fourni par l'appelant selon le contexte
  await sendEmail({
    to: user.email,
    template: payload.emailTemplate,
    data: { name: user.fullName, ...payload.emailData },
  });
}
