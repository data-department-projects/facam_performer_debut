"use client";

import { useEffect, useState, useTransition, type ComponentType } from "react";
import Link from "next/link";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Bell, AlertTriangle, CalendarClock, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { getMyOutstandingItems, type OutstandingItems, type OutstandingItem } from "@/actions/notifications";

const EMPTY: OutstandingItems = { overdue: [], upcoming: [], toValidate: [] };

// Rafraîchit le badge en tâche de fond tant que la page reste ouverte — pas de websocket,
// juste un aller-retour léger toutes les 5 minutes (le popover se rafraîchit en plus à
// chaque ouverture pour rester exact).
const POLL_INTERVAL_MS = 5 * 60 * 1000;

const TONE_CLASSES = {
  error: { icon: "text-error", badge: "bg-errorLight text-error" },
  info: { icon: "text-facamBlue", badge: "bg-facamBlueTint text-facamBlue" },
  warning: { icon: "text-warning", badge: "bg-warningLight text-warning" },
} as const;

type Tone = keyof typeof TONE_CLASSES;

function Section({
  title,
  icon: Icon,
  tone,
  items,
  onNavigate,
}: Readonly<{
  title: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: Tone;
  items: OutstandingItem[];
  onNavigate: () => void;
}>) {
  if (items.length === 0) return null;
  const classes = TONE_CLASSES[tone];

  return (
    <div className="border-b border-gray100 py-2 last:border-0">
      <div className="flex items-center gap-1.5 px-4 py-1.5">
        <Icon size={12} className={classes.icon} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray400">
          {title}
        </span>
      </div>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          onClick={onNavigate}
          className="flex items-center justify-between gap-3 px-4 py-2 transition-colors hover:bg-gray50"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-facamDark">{item.title}</p>
            <p className="truncate text-[11px] text-gray400">{item.subtitle}</p>
          </div>
          {item.overdueDays !== undefined && (
            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${classes.badge}`}>
              {item.overdueDays > 0 ? `${item.overdueDays} j de retard` : "en retard"}
            </span>
          )}
          {item.dateLabel && (
            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${classes.badge}`}>
              {item.dateLabel}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<OutstandingItems>(EMPTY);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const data = await getMyOutstandingItems();
      setItems(data);
    });
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) refresh();
  }

  const total = items.overdue.length + items.upcoming.length + items.toValidate.length;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray500 hover:bg-gray50 hover:text-facamBlue"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {total > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-facamWhite">
              {total > 9 ? "9+" : total}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 flex max-h-[70vh] w-[92vw] max-w-96 flex-col overflow-hidden rounded-xl border border-gray200 bg-facamWhite shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray100 px-4 py-3">
            <p className="text-sm font-semibold text-facamDark">Notifications</p>
            {total > 0 && (
              <span className="rounded-full bg-errorLight px-2 py-0.5 text-[10px] font-semibold text-error">
                {total} à traiter
              </span>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <Section title="En retard" icon={AlertTriangle} tone="error" items={items.overdue} onNavigate={() => setOpen(false)} />
            <Section title="Réunions à venir (48h)" icon={CalendarClock} tone="info" items={items.upcoming} onNavigate={() => setOpen(false)} />
            <Section title="À valider" icon={ClipboardCheck} tone="warning" items={items.toValidate} onNavigate={() => setOpen(false)} />

            {total === 0 && !isPending && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-successLight">
                  <CheckCircle2 size={18} className="text-success" />
                </span>
                <p className="text-xs text-gray400">Rien à traiter pour le moment.</p>
              </div>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
