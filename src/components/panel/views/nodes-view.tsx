"use client";

import { useState } from "react";
import { Activity, Clock, Cpu, HardDrive, Network, Plus, Server, Wifi, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type WingsNode = {
  id: string;
  name: string;
  hostname: string;
  port: number;
  useSsl: boolean;
  token: string;
  status: "online" | "offline";
  uptime: string;
  cpuUsed: number;
  cpuCores: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
  diskUsedGb: number;
  diskTotalGb: number;
  networkInGb: number;
  networkOutMb: number;
};

export function NodesView() {
  const [nodes, setNodes] = useState<WingsNode[]>([
    {
      id: "local",
      name: "Built-in Node (Local)",
      hostname: "localhost — Core System Node",
      port: 8080,
      useSsl: false,
      token: "builtin-token",
      status: "online",
      uptime: "26m",
      cpuUsed: 43,
      cpuCores: 2,
      memoryUsedGb: 2.0,
      memoryTotalGb: 7.8,
      diskUsedGb: 11.3,
      diskTotalGb: 31.3,
      networkInGb: 22,
      networkOutMb: 135.3,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    hostname: "",
    port: "8080",
    useSsl: false,
    token: "",
  });

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.hostname) {
      toast.error("Please fill in Node Name and Hostname.");
      return;
    }
    const newNode: WingsNode = {
      id: `node-${Date.now()}`,
      name: form.name,
      hostname: form.hostname,
      port: parseInt(form.port) || 8080,
      useSsl: form.useSsl,
      token: form.token,
      status: "online",
      uptime: "1m",
      cpuUsed: 12,
      cpuCores: 4,
      memoryUsedGb: 1.2,
      memoryTotalGb: 16.0,
      diskUsedGb: 8.5,
      diskTotalGb: 100.0,
      networkInGb: 0.4,
      networkOutMb: 42.1,
    };
    setNodes((prev) => [...prev, newNode]);
    setShowModal(false);
    setForm({ name: "", hostname: "", port: "8080", useSsl: false, token: "" });
    toast.success(`Wings Node "${newNode.name}" added successfully!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-ice">Nodes</h1>
          <p className="text-[13px] font-semibold text-steel">
            Monitor and manage execution environments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-4 py-2.5 text-[13px] font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Add Wings Node
        </button>
      </div>

      <div className="space-y-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="glass glass-strong overflow-hidden rounded-[18px] border border-line p-5 shadow-xl transition-colors hover:border-line-strong"
          >
            {/* Header */}
            <div className="flex flex-col justify-between gap-3 border-b border-line/60 pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-[12px] border border-accent/40 bg-accent/10 text-accent">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-black tracking-tight text-ice">{node.name}</h3>
                  <p className="text-[12px] font-medium text-steel">{node.hostname}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-ok">
                  <span className="size-2 rounded-full bg-ok animate-pulse" />
                  ONLINE
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-line bg-sunken px-3 py-1 text-[11px] font-bold text-steel">
                  <Clock className="size-3.5" />
                  {node.uptime}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* CPU */}
              <div className="rounded-[14px] border border-line/80 bg-sunken/60 p-4">
                <div className="flex items-center justify-between text-[12px] font-bold text-steel">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="size-4 text-accent" /> CPU
                  </span>
                  <span className="text-[14px] font-extrabold text-ice">{node.cpuUsed}%</span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-fill">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${node.cpuUsed}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-[11px] font-semibold text-steel">
                  <span>{node.cpuCores} Cores</span>
                  <span>{node.cpuUsed}% Used</span>
                </div>
              </div>

              {/* MEMORY */}
              <div className="rounded-[14px] border border-line/80 bg-sunken/60 p-4">
                <div className="flex items-center justify-between text-[12px] font-bold text-steel">
                  <span className="flex items-center gap-1.5">
                    <Activity className="size-4 text-accent" /> MEMORY
                  </span>
                  <span className="text-[14px] font-extrabold text-ice">
                    {Math.round((node.memoryUsedGb / node.memoryTotalGb) * 100)}%
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-fill">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${(node.memoryUsedGb / node.memoryTotalGb) * 100}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-[11px] font-semibold text-steel">
                  <span>{node.memoryUsedGb} GB</span>
                  <span>{node.memoryTotalGb} GB</span>
                </div>
              </div>

              {/* DISK */}
              <div className="rounded-[14px] border border-line/80 bg-sunken/60 p-4">
                <div className="flex items-center justify-between text-[12px] font-bold text-steel">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="size-4 text-accent" /> DISK
                  </span>
                  <span className="text-[14px] font-extrabold text-ice">
                    {Math.round((node.diskUsedGb / node.diskTotalGb) * 100)}%
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-fill">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${(node.diskUsedGb / node.diskTotalGb) * 100}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-[11px] font-semibold text-steel">
                  <span>{node.diskUsedGb} GB</span>
                  <span>{node.diskTotalGb} GB</span>
                </div>
              </div>

              {/* NETWORK */}
              <div className="rounded-[14px] border border-line/80 bg-sunken/60 p-4">
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-steel">
                  <Network className="size-4 text-accent" /> NETWORK
                </div>
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between rounded-[8px] border border-line/40 bg-fill/40 px-2.5 py-1 text-[11px] font-semibold text-steel">
                    <span className="text-ok">↓ Inbound</span>
                    <span className="font-mono text-ice">{node.networkInGb} GB</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[8px] border border-line/40 bg-fill/40 px-2.5 py-1 text-[11px] font-semibold text-steel">
                    <span className="text-accent">↑ Outbound</span>
                    <span className="font-mono text-ice">{node.networkOutMb} MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Wings Node Modal */}
      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass glass-strong view-enter w-full max-w-lg rounded-[20px] border border-line p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h3 className="text-[18px] font-black text-ice">Add Wings Node</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-steel hover:text-ice"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddNode} className="mt-5 space-y-4">
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-steel">
                  Node Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. EU Node 01"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="panel-input mt-1.5 w-full"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-steel">
                    Hostname (FQDN or IP)
                  </label>
                  <input
                    type="text"
                    placeholder="node1.example.com"
                    value={form.hostname}
                    onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                    className="panel-input mt-1.5 w-full"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-steel">
                    API Port
                  </label>
                  <input
                    type="text"
                    placeholder="8080"
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: e.target.value })}
                    className="panel-input mt-1.5 w-full font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-[13px] font-semibold text-ice">
                <input
                  type="checkbox"
                  checked={form.useSsl}
                  onChange={(e) => setForm({ ...form, useSsl: e.target.checked })}
                  className="size-4 rounded border-line bg-sunken text-accent focus:ring-accent"
                />
                Use SSL for API Connection
              </label>

              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-steel">
                  API Token
                </label>
                <input
                  type="password"
                  placeholder="Wings bearer token"
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                  className="panel-input mt-1.5 w-full font-mono"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-[10px] border border-line bg-sunken px-4 py-2 text-[13px] font-bold text-steel hover:text-ice"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[10px] bg-accent px-5 py-2 text-[13px] font-bold text-white shadow-lg hover:brightness-110"
                >
                  Save Node Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
