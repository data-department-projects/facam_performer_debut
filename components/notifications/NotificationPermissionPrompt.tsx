"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { subscribeToPush } from "@/lib/push-client";

// Affiché uniquement quand notificationConsent = NOT_ASKED (passé depuis le Server Component parent)
export function NotificationPermissionPrompt() {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  async function handleActivate() {
    setLoading(true);
    try {
      const subscription = await subscribeToPush();

      if (!subscription?.endpoint || !subscription?.keys) {
        // Permission refusée par le navigateur → marquer DECLINED
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        setVisible(false);
        return;
      }

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        }),
      });

      setVisible(false);
    } catch (error) {
      console.error("[NotificationPermissionPrompt] handleActivate", error);
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleLater() {
    setVisible(false);
    // notificationConsent reste NOT_ASKED — bandeau réapparaîtra à la prochaine session
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-gray200 bg-facamWhite px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-facamBlueTint">
          <Bell size={18} className="text-facamBlue" />
        </div>
        <p className="text-sm text-facamBlack">
          Activez les notifications pour rester informé en temps réel (réunions,
          tâches, validations).
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleActivate}
          disabled={loading}
          className="btn-accent text-sm"
        >
          {loading ? "…" : "Activer"}
        </button>
        <button
          type="button"
          onClick={handleLater}
          className="btn-ghost text-sm text-gray500"
        >
          Plus tard
        </button>
        <button
          type="button"
          onClick={handleLater}
          className="text-gray400 hover:text-gray600"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
