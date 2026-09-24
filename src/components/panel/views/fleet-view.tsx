"use client";

import { useState } from "react";
import { MoreVertical, Search, Server, Terminal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, cn } from "@/lib/utils";
import { usePanel } from "../context";

export function FleetView() {
  const { servers, setServers, openServer } = usePanel();
  const [search, setSearch] = useState("");

  const filtered = servers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      (s.ownerName && s.ownerName.toLowerCase().includes(search.toLowerCase())),
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete server "${name}"?`)) return;
    try {
      await api(`/api/servers/${id}`, { method: "DELETE" });
      setServers(servers.filter((s) => s.id !== id));
      toast.success(`Server "${name}" deleted.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete server");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-accent uppercase">
          <span className="size-2 rounded-full bg-accent" />
          CORE — FLEET ADMINISTRATION
        </div>
        <h1 className="mt-1 text-[32px] font-black tracking-tight text-ice">MANAGE SERVERS</h1>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute top-3.5 left-3.5 size-4 text-steel" />
        <input
          type="text"
          placeholder="Search servers by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="panel-input w-full pl-10 text-[14px]"
        />
      </div>

      {/* Server List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass glass-strong py-12 text-center rounded-[16px] border border-line text-steel">
            No servers found matching your search.
          </div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className="glass glass-strong flex flex-col justify-between gap-4 rounded-[16px] border border-line p-4 transition-colors hover:border-line-strong sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3.5">
                <div className="grid size-11 shrink-0 place-items-center rounded-[12px] border border-accent/40 bg-accent/10 text-accent">
                  <Server className="size-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-black tracking-tight text-ice">{s.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-steel">
                    <span className="capitalize">{s.template}</span>
                    <span>•</span>
                    <span>26.3</span>
                    {s.ownerName ? (
                      <>
                        <span>•</span>
                        <span>Owner: {s.ownerName}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => openServer(s.id)}
                  className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-4 py-2 text-[13px] font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Terminal className="size-3.5" />
                  Console &gt;
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(s.id, s.name)}
                  className="inline-flex size-9 items-center justify-center rounded-[10px] border border-line bg-sunken text-steel hover:border-danger/50 hover:bg-danger/10 hover:text-danger"
                  title="Delete Server"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
