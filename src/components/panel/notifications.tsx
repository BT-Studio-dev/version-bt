"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCircle2, ExternalLink, Info, ShieldAlert, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  time: string;
  unread: boolean;
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const ref = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<Notification[]>([
    {
      id: "1",
      type: "success",
      title: "System Services Online",
      message: "Docker engine and server management stack are running normally.",
      time: "Just now",
      unread: true,
    },
    {
      id: "2",
      type: "warning",
      title: "Security & Access",
      message: "Ensure custom API keys and passwords are securely configured in Settings.",
      time: "10m ago",
      unread: true,
    },
    {
      id: "3",
      type: "info",
      title: "Welcome to JTG Panel",
      message: "Create high-performance game servers with one-click deployment.",
      time: "1h ago",
      unread: false,
    },
  ]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const unreadCount = items.filter((i) => i.unread).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((i) => ({ ...i, unread: false })));
  };

  const clearAll = () => {
    setItems([]);
  };

  const displayed = tab === "unread" ? items.filter((i) => i.unread) : items;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex size-10 items-center justify-center rounded-[10px] border border-line bg-sunken text-steel transition-colors hover:border-line-strong hover:text-ice"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-accent animate-ping" />
        ) : null}
        {unreadCount > 0 ? (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-accent" />
        ) : null}
      </button>

      {open ? (
        <div className="glass glass-strong view-enter absolute top-[calc(100%+8px)] right-0 z-50 w-80 sm:w-96 rounded-[18px] border border-line p-4 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-black text-ice">Notifications</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[10px] font-extrabold text-accent">
                  {unreadCount} new
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-steel">
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-bold hover:text-ice"
                title="Mark all read"
              >
                <Check className="size-3.5" /> Mark read
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="p-1 hover:text-danger"
                title="Clear all"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-extrabold transition-colors",
                tab === "all" ? "bg-accent/20 text-accent border border-accent/40" : "text-steel hover:text-ice",
              )}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("unread")}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-extrabold transition-colors",
                tab === "unread" ? "bg-accent/20 text-accent border border-accent/40" : "text-steel hover:text-ice",
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
            {displayed.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-steel">No notifications</div>
            ) : (
              displayed.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "relative rounded-[12px] border p-3 transition-colors",
                    item.unread ? "border-line bg-sunken/80" : "border-line/40 bg-sunken/30 opacity-70",
                  )}
                >
                  {item.unread ? (
                    <span className="absolute top-3 right-3 size-2 rounded-full bg-accent" />
                  ) : null}

                  <div className="flex items-start gap-2.5">
                    {item.type === "success" ? (
                      <CheckCircle2 className="size-4 text-ok shrink-0 mt-0.5" />
                    ) : item.type === "warning" ? (
                      <ShieldAlert className="size-4 text-accent shrink-0 mt-0.5" />
                    ) : (
                      <Info className="size-4 text-steel shrink-0 mt-0.5" />
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-extrabold text-ice">{item.title}</span>
                        <span className="text-[10px] font-medium text-steel shrink-0">{item.time}</span>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-snug text-steel">{item.message}</p>

                      <a
                        href="#details"
                        onClick={(e) => e.preventDefault()}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
                      >
                        View details <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
