"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FileText,
  Folder,
  FolderPlus,
  Globe,
  HardDrive,
  Key,
  KeyRound,
  Lock,
  MemoryStick,
  MoreVertical,
  Network,
  Package,
  Play,
  Plus,
  Power,
  RefreshCw,
  RotateCw,
  Search,
  Send,
  Server as ServerIcon,
  Settings,
  ShieldCheck,
  Sliders,
  Square,
  Terminal,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { CPU_OPTIONS, DISK_OPTIONS, MEMORY_OPTIONS, NODES, SERVER_TEMPLATES, getTemplate } from "@/lib/panel/catalog";
import { formatRate, sampleTelemetry } from "@/lib/panel/telemetry";
import type { PowerAction, ServerDto, ServerEventDto } from "@/lib/panel/types";
import { api, cn, formatDuration, formatJoined, formatMb } from "@/lib/utils";
import { usePanel } from "../context";
import { EmptyState, Field, Meter, Modal, Spinner, StatusBadge, TemplateBadge, useNow } from "../ui";

type Filter = "all" | "running" | "offline";
type ServerSnapshot = { server: ServerDto; events: ServerEventDto[] };
type ServerTab = "terminal" | "properties" | "files" | "sftp" | "subusers" | "plugins" | "settings" | "backup";

export function ServersView() {
  const { openServerId } = usePanel();
  return openServerId ? <ServerControlPanel key={openServerId} id={openServerId} /> : <ServerList />;
}

// ── Server List View ────────────────────────────────────────────────────────
function ServerList() {
  const { servers, openServer, setServers } = usePanel();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openDeployModal, setOpenDeployModal] = useState(false);

  const filtered = servers.filter((s) => {
    if (filter === "running" && s.status !== "running") return false;
    if (filter === "offline" && s.status === "running") return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.ownerName && s.ownerName.toLowerCase().includes(q));
  });

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-ice">Instances</h1>
          <p className="mt-1 text-[13px] font-semibold text-steel">Manage and deploy your containerized server fleet.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpenDeployModal(true)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-4 py-2.5 text-[13px] font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="size-4" /> Deploy Instance
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="flex gap-1.5 rounded-[12px] border border-line bg-sunken p-1 w-fit">
          {(["all", "running", "offline"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={cn("pill-tab text-[12px] px-3 py-1 capitalize", filter === f && "active")}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute top-2.5 left-3 size-4 text-steel" />
          <input
            type="text"
            placeholder="Search servers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="panel-input w-full pl-9 text-[13px]"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="glass py-12 text-center text-steel">No servers found matching your criteria.</div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => openServer(s.id)}
              className="glass glass-strong flex cursor-pointer flex-col justify-between gap-4 rounded-[16px] border border-line p-4 transition-all hover:border-line-strong sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3.5">
                <TemplateBadge templateId={s.template} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[16px] font-extrabold text-ice">{s.name}</h3>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-steel">
                    <span>Port: {s.port}</span>
                    <span>•</span>
                    <span>CPU: {s.cpuLimit}%</span>
                    <span>•</span>
                    <span>RAM: {formatMb(s.memoryMb)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openServer(s.id);
                  }}
                  className="rounded-[10px] bg-accent px-4 py-2 text-[13px] font-bold text-white shadow hover:brightness-110"
                >
                  Manage &gt;
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {openDeployModal ? <DeployModal onClose={() => setOpenDeployModal(false)} /> : null}
    </div>
  );
}

// ── Main Server Control Panel (Matching Screenshots) ────────────────────────
function ServerControlPanel({ id }: { id: string }) {
  const { servers, openServer, upsertServer } = usePanel();
  const [server, setServer] = useState<ServerDto | null>(() => servers.find((s) => s.id === id) ?? null);
  const [events, setEvents] = useState<ServerEventDto[] | null>(null);
  const [activeTab, setActiveTab] = useState<ServerTab>("terminal");
  const [missing, setMissing] = useState(false);
  const now = useNow(1000);

  const apply = useCallback(
    (data: ServerSnapshot) => {
      setServer(data.server);
      setEvents(data.events);
      upsertServer(data.server);
    },
    [upsertServer],
  );

  const handlePower = async (action: PowerAction) => {
    if (!server) return;
    try {
      const res = await api<ServerSnapshot>(`/api/servers/${server.id}`, { method: "POST", body: { action } });
      apply(res);
      toast.success(`Server ${action} command sent!`);
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${action} server`);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const runLoad = async () => {
      try {
        const snapshot = await api<ServerSnapshot>(`/api/servers/${id}`);
        if (!cancelled) apply(snapshot);
      } catch (err) {
        if (!cancelled && err instanceof Error && /not found/i.test(err.message)) setMissing(true);
      }
    };
    void runLoad();
    const timer = window.setInterval(() => {
      if (!document.hidden) void runLoad();
    }, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [id, apply]);

  if (missing || !server) {
    return (
      <div className="glass p-8 text-center">
        <h2 className="text-[18px] font-black text-ice">Server not found</h2>
        <button type="button" onClick={() => openServer(null)} className="mt-4 rounded-[10px] bg-accent px-4 py-2 font-bold text-white">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const isOnline = server.status === "running";

  return (
    <div className="flex flex-col gap-6 lg:flex-row min-h-dvh">
      {/* Left Control Sidebar */}
      <div className="w-full lg:w-64 shrink-0 space-y-4">
        {/* Status Card & Power Quick Controls */}
        <div className="glass glass-strong rounded-[20px] border border-line p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-[12px] font-bold">
            <span className="flex items-center gap-1.5 text-ice">
              <span className={cn("size-2 rounded-full", isOnline ? "bg-ok animate-pulse" : "bg-steel")} />
              <span className="capitalize">{server.status}</span>
            </span>
            <span className="font-mono text-steel flex items-center gap-1">
              {server.port}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(String(server.port));
                  toast.success("Port copied!");
                }}
                className="hover:text-ice"
              >
                <Copy className="size-3" />
              </button>
            </span>
          </div>

          <div className="space-y-1.5">
            {!isOnline ? (
              <button
                type="button"
                onClick={() => handlePower("start")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] border border-ok/40 bg-ok/10 py-2 text-[12.5px] font-extrabold text-ok hover:bg-ok/20 transition-colors"
              >
                <Play className="size-3.5" /> Start
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePower("stop")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-danger/40 bg-danger/10 py-2 text-[12px] font-extrabold text-danger hover:bg-danger/20 transition-colors"
                >
                  <Square className="size-3.5" /> Stop
                </button>
                <button
                  type="button"
                  onClick={() => handlePower("kill")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-danger/40 bg-danger/20 py-2 text-[12px] font-extrabold text-danger hover:bg-danger/30 transition-colors"
                >
                  <Power className="size-3.5" /> Kill
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => handlePower("restart")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] border border-amber-500/40 bg-amber-500/10 py-2 text-[12.5px] font-extrabold text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <RotateCw className="size-3.5" /> Restart
            </button>
          </div>
        </div>

        {/* Server Navigation Menu */}
        <div className="glass glass-strong rounded-[20px] border border-line p-3 shadow-xl space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-extrabold tracking-[0.16em] text-faint uppercase">MENU</div>
          {[
            { id: "terminal", label: "Terminal", icon: Terminal },
            { id: "properties", label: "Properties", icon: Sliders },
            { id: "files", label: "File Manager", icon: Folder },
            { id: "sftp", label: "SFTP Details", icon: Key },
            { id: "subusers", label: "Sub-Users", icon: Users },
            { id: "plugins", label: "Plugins", icon: Package },
            { id: "settings", label: "Settings", icon: Settings },
            { id: "backup", label: "Backup", icon: HardDrive },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as ServerTab)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[12.5px] font-extrabold transition-all",
                  active
                    ? "bg-accent/20 border-l-4 border-accent text-ice shadow"
                    : "text-steel hover:bg-fill hover:text-ice",
                )}
              >
                <Icon className="size-4 shrink-0 text-steel" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="my-2 h-px bg-line/60" />

          <div className="px-3 py-1 text-[10px] font-extrabold tracking-[0.16em] text-faint uppercase">NAVIGATION</div>
          <button
            type="button"
            onClick={() => openServer(null)}
            className="flex w-full items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[12.5px] font-extrabold text-steel hover:bg-fill hover:text-ice transition-all"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Server Tab Content */}
      <div className="flex-1 min-w-0">
        {activeTab === "terminal" ? <ConsoleTab server={server} events={events} onPower={handlePower} now={now} /> : null}
        {activeTab === "properties" ? <PropertiesTab server={server} /> : null}
        {activeTab === "files" ? <FileManagerTab server={server} /> : null}
        {activeTab === "sftp" ? <SftpTab server={server} /> : null}
        {activeTab === "subusers" ? <SubUsersTab server={server} /> : null}
        {activeTab === "plugins" ? <PluginsTab server={server} /> : null}
        {activeTab === "settings" ? <ServerSettingsTab server={server} onRenamed={setServer} /> : null}
        {activeTab === "backup" ? <BackupTab server={server} /> : null}
      </div>
    </div>
  );
}

// ── Tab 1: Terminal (Console View) ───────────────────────────────────────────
function ConsoleTab({
  server,
  events,
  onPower,
  now,
}: {
  server: ServerDto;
  events: ServerEventDto[] | null;
  onPower: (action: PowerAction) => void;
  now: number | null;
}) {
  const [cmd, setCmd] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const tel = now ? sampleTelemetry(server, now) : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!cmd.trim()) return;
    try {
      await api(`/api/servers/${server.id}`, { method: "POST", body: { action: "cmd", command: cmd } });
      setCmd("");
    } catch {
      toast.error("Failed to send command.");
    }
  };

  const isOnline = server.status === "running";

  return (
    <div className="space-y-4">
      {/* Top Title & Round Power Controls Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[20px] font-black text-ice">
          <span className={cn("size-3 rounded-full", isOnline ? "bg-ok" : "bg-steel")} />
          {server.name}
        </div>

        {/* Round Power Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPower("start")}
            className="grid size-10 place-items-center rounded-full bg-ok text-white shadow-lg hover:brightness-110 active:scale-95"
            title="Start Server"
          >
            <Play className="size-4 fill-white" />
          </button>
          <button
            type="button"
            onClick={() => onPower("restart")}
            className="grid size-10 place-items-center rounded-full bg-amber-500 text-white shadow-lg hover:brightness-110 active:scale-95"
            title="Restart Server"
          >
            <RotateCw className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onPower("stop")}
            className="grid size-10 place-items-center rounded-full bg-accent text-white shadow-lg hover:brightness-110 active:scale-95"
            title="Stop Server"
          >
            <Square className="size-4 fill-white" />
          </button>
          <button
            type="button"
            onClick={() => onPower("kill")}
            className="grid size-10 place-items-center rounded-full bg-red-700 text-white shadow-lg hover:brightness-110 active:scale-95"
            title="Kill Server"
          >
            <Power className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Terminal Window */}
        <div className="flex flex-col rounded-[18px] border border-line bg-black/90 p-4 shadow-2xl h-[460px]">
          <div className="scrollbar-thin flex-1 overflow-y-auto font-mono text-[12px] leading-relaxed text-steel space-y-1">
            {events?.map((ev) => (
              <div
                key={ev.id}
                className={cn(
                  ev.level === "error" && "text-danger font-bold",
                  ev.level === "warn" && "text-amber-400",
                  ev.level === "cmd" && "text-accent font-bold",
                  ev.level === "system" && "text-ok font-bold",
                )}
              >
                {ev.message}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} className="mt-3 flex items-center gap-2 border-t border-line/60 pt-3">
            <span className="font-mono text-steel">&gt;</span>
            <input
              type="text"
              placeholder="Type a command..."
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              className="flex-1 bg-transparent font-mono text-[13px] text-ice outline-none placeholder:text-faint"
            />
          </form>
        </div>

        {/* Right Stats Column */}
        <div className="space-y-3">
          <div className="rounded-[14px] border border-line/80 bg-sunken/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-bold text-steel">
              <Wifi className="size-4 text-accent" /> Address
            </div>
            <span className="font-mono text-[14px] font-black text-ice">{server.port}</span>
          </div>

          <div className="rounded-[14px] border border-line/80 bg-sunken/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-bold text-steel">
              <Clock className="size-4 text-accent" /> Uptime
            </div>
            <span className="font-mono text-[13px] font-bold text-ice">
              {isOnline && server.startedAt && now ? formatDuration(now - Date.parse(server.startedAt)) : "—"}
            </span>
          </div>

          <div className="rounded-[14px] border border-line/80 bg-sunken/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-bold text-steel">
              <Cpu className="size-4 text-accent" /> CPU Load
            </div>
            <span className="font-mono text-[13px] font-bold text-ice">
              {tel ? `${tel.cpu.toFixed(1)}% / ${server.cpuLimit}%` : "—"}
            </span>
          </div>

          <div className="rounded-[14px] border border-line/80 bg-sunken/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-bold text-steel">
              <MemoryStick className="size-4 text-accent" /> Memory
            </div>
            <span className="font-mono text-[13px] font-bold text-ice">
              {tel ? `${formatMb(tel.memMb)} / ${formatMb(server.memoryMb)}` : "—"}
            </span>
          </div>

          <div className="rounded-[14px] border border-line/80 bg-sunken/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-bold text-steel">
              <HardDrive className="size-4 text-accent" /> Disk
            </div>
            <span className="font-mono text-[13px] font-bold text-ice">
              {tel ? `${formatMb(tel.diskMb)} / ${formatMb(server.diskMb)}` : "—"}
            </span>
          </div>

          <div className="rounded-[14px] border border-line/80 bg-sunken/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-bold text-steel">
              <Network className="size-4 text-accent" /> Network (Inbound)
            </div>
            <span className="font-mono text-[13px] font-bold text-ice">{tel ? `↓ ${formatRate(tel.netIn)}` : "—"}</span>
          </div>

          <div className="rounded-[14px] border border-line/80 bg-sunken/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-bold text-steel">
              <Network className="size-4 text-accent" /> Network (Outbound)
            </div>
            <span className="font-mono text-[13px] font-bold text-ice">{tel ? `↑ ${formatRate(tel.netOut)}` : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Properties (Images 3 & 4 Style) ───────────────────────────────────
function PropertiesTab({ server }: { server: ServerDto }) {
  const [props, setProps] = useState({
    onlineMode: false,
    pvp: false,
    hardcore: false,
    allowFlight: false,
    enableCommandBlock: false,
    gamemode: "survival",
    difficulty: "peaceful",
    maxPlayers: "20",
    motd: "A Minecraft Server on JTG Panel",
    viewDistance: "10",
    serverPort: String(server.port),
    queryPort: String(server.port),
    enableRcon: "true",
    rconPort: "25575",
    rconPassword: "admin",
  });

  const save = () => {
    toast.success("Properties saved successfully!");
  };

  return (
    <div className="glass glass-strong space-y-6 rounded-[20px] border border-line p-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h2 className="text-[20px] font-black text-ice">Properties</h2>
          <p className="text-[11px] font-bold uppercase tracking-wider text-accent">CONFIGURE CORE SERVER RULES AND SETTINGS</p>
        </div>
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-5 py-2.5 text-[13px] font-bold text-white shadow-lg hover:brightness-110"
        >
          <Check className="size-4" /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* ONLINE MODE */}
        <div className="rounded-[14px] border border-line bg-sunken p-4 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-black text-ice">ONLINE MODE (PREMIUM)</div>
            <div className="text-[10px] font-mono text-steel">Key: online-mode</div>
          </div>
          <input
            type="checkbox"
            checked={props.onlineMode}
            onChange={(e) => setProps({ ...props, onlineMode: e.target.checked })}
            className="size-5 rounded border-line bg-sunken text-accent"
          />
        </div>

        {/* PVP */}
        <div className="rounded-[14px] border border-line bg-sunken p-4 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-black text-ice">PLAYER VS PLAYER (PVP)</div>
            <div className="text-[10px] font-mono text-steel">Key: pvp</div>
          </div>
          <input
            type="checkbox"
            checked={props.pvp}
            onChange={(e) => setProps({ ...props, pvp: e.target.checked })}
            className="size-5 rounded border-line bg-sunken text-accent"
          />
        </div>

        {/* HARDCORE */}
        <div className="rounded-[14px] border border-line bg-sunken p-4 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-black text-ice">HARDCORE</div>
            <div className="text-[10px] font-mono text-steel">Key: hardcore</div>
          </div>
          <input
            type="checkbox"
            checked={props.hardcore}
            onChange={(e) => setProps({ ...props, hardcore: e.target.checked })}
            className="size-5 rounded border-line bg-sunken text-accent"
          />
        </div>

        {/* ALLOW FLIGHT */}
        <div className="rounded-[14px] border border-line bg-sunken p-4 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-black text-ice">ALLOW FLIGHT</div>
            <div className="text-[10px] font-mono text-steel">Key: allow-flight</div>
          </div>
          <input
            type="checkbox"
            checked={props.allowFlight}
            onChange={(e) => setProps({ ...props, allowFlight: e.target.checked })}
            className="size-5 rounded border-line bg-sunken text-accent"
          />
        </div>

        {/* ENABLE COMMAND BLOCKS */}
        <div className="rounded-[14px] border border-line bg-sunken p-4 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-black text-ice">ENABLE COMMAND BLOCKS</div>
            <div className="text-[10px] font-mono text-steel">Key: enable-command-block</div>
          </div>
          <input
            type="checkbox"
            checked={props.enableCommandBlock}
            onChange={(e) => setProps({ ...props, enableCommandBlock: e.target.checked })}
            className="size-5 rounded border-line bg-sunken text-accent"
          />
        </div>

        {/* GAME MODE */}
        <div className="rounded-[14px] border border-line bg-sunken p-4">
          <div className="text-[13px] font-black text-ice">GAME MODE</div>
          <select
            value={props.gamemode}
            onChange={(e) => setProps({ ...props, gamemode: e.target.value })}
            className="panel-input mt-2 w-full text-[13px]"
          >
            <option value="survival">survival</option>
            <option value="creative">creative</option>
            <option value="adventure">adventure</option>
            <option value="spectator">spectator</option>
          </select>
          <div className="mt-1 text-[10px] font-mono text-steel">Key: gamemode</div>
        </div>

        {/* DIFFICULTY */}
        <div className="rounded-[14px] border border-line bg-sunken p-4">
          <div className="text-[13px] font-black text-ice">DIFFICULTY</div>
          <select
            value={props.difficulty}
            onChange={(e) => setProps({ ...props, difficulty: e.target.value })}
            className="panel-input mt-2 w-full text-[13px]"
          >
            <option value="peaceful">peaceful</option>
            <option value="easy">easy</option>
            <option value="normal">normal</option>
            <option value="hard">hard</option>
          </select>
          <div className="mt-1 text-[10px] font-mono text-steel">Key: difficulty</div>
        </div>

        {/* MAX PLAYERS */}
        <div className="rounded-[14px] border border-line bg-sunken p-4">
          <div className="text-[13px] font-black text-ice">MAX PLAYERS</div>
          <input
            type="number"
            value={props.maxPlayers}
            onChange={(e) => setProps({ ...props, maxPlayers: e.target.value })}
            className="panel-input mt-2 w-full text-[13px] font-mono"
          />
          <div className="mt-1 text-[10px] font-mono text-steel">Key: max-players</div>
        </div>

        {/* MOTD */}
        <div className="col-span-1 sm:col-span-2 rounded-[14px] border border-line bg-sunken p-4">
          <div className="text-[13px] font-black text-ice">MOTD (MESSAGE OF THE DAY)</div>
          <input
            type="text"
            value={props.motd}
            onChange={(e) => setProps({ ...props, motd: e.target.value })}
            className="panel-input mt-2 w-full text-[13px]"
          />
          <div className="mt-1 text-[10px] font-mono text-steel">Key: motd</div>
        </div>
      </div>

      {/* Advanced Properties */}
      <div className="pt-4">
        <h3 className="text-[16px] font-black text-ice">Advanced Properties</h3>
        <div className="mt-3 rounded-[16px] border border-line bg-sunken p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono text-steel">server-port</label>
            <input type="text" value={props.serverPort} onChange={(e) => setProps({ ...props, serverPort: e.target.value })} className="panel-input mt-1 w-full font-mono text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-steel">query.port</label>
            <input type="text" value={props.queryPort} onChange={(e) => setProps({ ...props, queryPort: e.target.value })} className="panel-input mt-1 w-full font-mono text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-steel">enable-rcon</label>
            <input type="text" value={props.enableRcon} onChange={(e) => setProps({ ...props, enableRcon: e.target.value })} className="panel-input mt-1 w-full font-mono text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-steel">rcon.port</label>
            <input type="text" value={props.rconPort} onChange={(e) => setProps({ ...props, rconPort: e.target.value })} className="panel-input mt-1 w-full font-mono text-[13px]" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[11px] font-mono text-steel">rcon.password</label>
            <input type="password" value={props.rconPassword} onChange={(e) => setProps({ ...props, rconPassword: e.target.value })} className="panel-input mt-1 w-full font-mono text-[13px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: File Manager (Images 5 & 15 Style) ────────────────────────────────
function FileManagerTab({ server }: { server: ServerDto }) {
  const [files, setFiles] = useState([
    { name: ".cache", isFolder: true, size: "Folder" },
    { name: ".paper.env", isFolder: false, size: "0.1 KB" },
    { name: ".papermc-manifest.json", isFolder: false, size: "0.2 KB" },
    { name: ".rcon-cli.env", isFolder: false, size: "0.0 KB" },
    { name: ".rcon-cli.yaml", isFolder: false, size: "0.0 KB" },
    { name: "bukkit.yml", isFolder: false, size: "1.1 KB" },
    { name: "cache", isFolder: true, size: "Folder" },
    { name: "config", isFolder: true, size: "Folder" },
    { name: "eula.txt", isFolder: false, size: "0.0 KB" },
    { name: "libraries", isFolder: true, size: "Folder" },
    { name: "logs", isFolder: true, size: "Folder" },
    { name: "paper-26.3-40.jar", isFolder: false, size: "63649.3 KB" },
    { name: "plugins", isFolder: true, size: "Folder" },
    { name: "server.properties", isFolder: false, size: "0.1 KB" },
  ]);

  const [search, setSearch] = useState("");

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleUpload = () => {
    toast.success("File upload simulated!");
  };

  return (
    <div className="glass glass-strong space-y-4 rounded-[20px] border border-line p-5 shadow-2xl">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-[8px] border border-line bg-sunken p-2 text-steel hover:text-ice">
            <ArrowLeft className="size-4" />
          </button>
          <span className="rounded-[8px] bg-accent/20 border border-accent/40 px-3 py-1 text-[12px] font-bold text-accent">
            Root
          </span>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute top-2.5 left-3 size-4 text-steel" />
          <input
            type="text"
            placeholder="Search files & folders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="panel-input w-full pl-9 text-[12px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-sunken px-3 py-2 text-[12px] font-bold text-ice">
            <FileText className="size-3.5 text-accent" /> File
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-sunken px-3 py-2 text-[12px] font-bold text-ice">
            <FolderPlus className="size-3.5 text-accent" /> Folder
          </button>
          <button type="button" onClick={handleUpload} className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-[12px] font-bold text-white shadow">
            <Upload className="size-3.5" /> Upload
          </button>
          <button type="button" onClick={() => toast.success("Refreshed!")} className="rounded-[10px] border border-line bg-sunken p-2 text-steel hover:text-ice">
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* File Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line text-[11px] font-black uppercase tracking-wider text-steel">
              <th className="py-2.5 px-3 w-8">
                <input type="checkbox" className="size-4 rounded border-line bg-sunken" />
              </th>
              <th className="py-2.5 px-3">NAME</th>
              <th className="py-2.5 px-3 text-right">SIZE</th>
              <th className="py-2.5 px-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40 font-mono text-[12.5px]">
            {filtered.map((item) => (
              <tr key={item.name} className="hover:bg-fill/30 transition-colors">
                <td className="py-2.5 px-3">
                  <input type="checkbox" className="size-4 rounded border-line bg-sunken" />
                </td>
                <td className="py-2.5 px-3 flex items-center gap-2.5 font-bold text-ice">
                  {item.isFolder ? <Folder className="size-4 text-accent shrink-0" /> : <FileText className="size-4 text-steel shrink-0" />}
                  <span>{item.name}</span>
                </td>
                <td className="py-2.5 px-3 text-right text-steel">{item.size}</td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex justify-end gap-1 text-steel">
                    <button type="button" onClick={() => toast.success(`Downloading ${item.name}`)} className="p-1 hover:text-ice">
                      <Download className="size-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:text-ice">
                      <MoreVertical className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 4: SFTP Details (Image 6 Style) ──────────────────────────────────────
function SftpTab({ server }: { server: ServerDto }) {
  const [password, setPassword] = useState("••••••••••••••••");

  const genPass = () => {
    const p = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    setPassword(p);
    toast.success("New SFTP password generated!");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-[18px] font-black text-ice">
          <Key className="size-5 text-accent" /> SFTP Details
        </div>
        <p className="mt-1 text-[12px] text-steel">
          Manage your secure file transfer protocol (SFTP) access credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Connection Info */}
        <div className="glass glass-strong rounded-[20px] border border-line p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-[15px] font-extrabold text-ice">
            <Key className="size-4 text-accent" /> Connection Info
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-steel">HOST</label>
            <div className="mt-1 flex gap-2">
              <input type="text" readOnly value="localhost" className="panel-input w-full font-mono text-[13px]" />
              <button type="button" onClick={() => { navigator.clipboard.writeText("localhost"); toast.success("Copied!"); }} className="p-2 border border-line bg-sunken rounded-[8px] text-steel hover:text-ice">
                <Copy className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-steel">PORT</label>
            <div className="mt-1 flex gap-2">
              <input type="text" readOnly value="2022" className="panel-input w-full font-mono text-[13px]" />
              <button type="button" onClick={() => { navigator.clipboard.writeText("2022"); toast.success("Copied!"); }} className="p-2 border border-line bg-sunken rounded-[8px] text-steel hover:text-ice">
                <Copy className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-steel">USERNAME</label>
            <div className="mt-1 flex gap-2">
              <input type="text" readOnly value={`srv_${server.id.slice(0, 6)}`} className="panel-input w-full font-mono text-[13px]" />
              <button type="button" onClick={() => { navigator.clipboard.writeText(`srv_${server.id.slice(0, 6)}`); toast.success("Copied!"); }} className="p-2 border border-line bg-sunken rounded-[8px] text-steel hover:text-ice">
                <Copy className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-steel">PASSWORD</label>
            <div className="mt-1 flex gap-2">
              <input type="text" readOnly value={password} className="panel-input w-full font-mono text-[13px]" />
              <button type="button" onClick={genPass} className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-[12px] font-bold text-white shadow shrink-0">
                <RotateCw className="size-3.5" /> Generate Password
              </button>
            </div>
            <p className="mt-1 text-[11px] text-steel">For security, passwords are not stored. Generate a new one to connect.</p>
          </div>
        </div>

        {/* How to Connect Guide */}
        <div className="glass glass-strong rounded-[20px] border border-line p-6 shadow-2xl space-y-4">
          <h3 className="text-[15px] font-extrabold text-ice">How to connect</h3>
          <p className="text-[12.5px] text-steel leading-relaxed">
            You can connect to your server&apos;s files using an SFTP client such as <span className="text-accent font-bold">FileZilla</span>, <span className="text-accent font-bold">WinSCP</span>, or <span className="text-accent font-bold">Cyberduck</span>.
          </p>

          <div className="rounded-[14px] border border-line bg-sunken/60 p-4 text-[12px] text-steel space-y-2 leading-relaxed">
            <div className="font-bold text-ice">Quick steps:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your preferred SFTP client.</li>
              <li>Copy and paste the <span className="font-bold text-ice">Host</span> and <span className="font-bold text-ice">Port</span>.</li>
              <li>Enter your generated <span className="font-bold text-ice">Username</span>.</li>
              <li>Copy the <span className="font-bold text-ice">Password</span> and paste it into the password field.</li>
              <li>Click Connect.</li>
            </ol>
          </div>

          <div className="rounded-[14px] border border-amber-500/30 bg-amber-500/10 p-3.5 text-[12px] text-amber-200">
            <span className="font-bold">Note:</span> Your SFTP access is isolated. You can only view and modify files within this specific server&apos;s directory.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Sub-Users (Images 7, 8, 9 Style) ──────────────────────────────────
function SubUsersTab({ server }: { server: ServerDto }) {
  const { team } = usePanel();
  const [subUsers, setSubUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(team[0]?.username || "");

  const handleAddUser = () => {
    setSubUsers((prev) => [...prev, { username: selectedUser, role: "Sub-User" }]);
    setShowModal(false);
    toast.success(`User "${selectedUser}" granted access to server.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-black text-ice">Sub-Users</h2>
          <p className="text-[12px] text-steel">Manage users who have access to this server.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-4 py-2 text-[13px] font-bold text-white shadow-lg hover:brightness-110"
        >
          <UserPlus className="size-4" /> Add User
        </button>
      </div>

      <div className="glass glass-strong rounded-[20px] border border-line p-6 shadow-2xl">
        {subUsers.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Users className="mx-auto size-8 text-steel" />
            <h3 className="text-[16px] font-bold text-ice">No Sub-Users</h3>
            <p className="text-[12px] text-steel">You haven&apos;t granted access to any other users for this server yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subUsers.map((u, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-[12px] border border-line bg-sunken p-3">
                <span className="font-bold text-ice">{u.username}</span>
                <span className="text-[11px] font-mono text-steel">{u.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Sub-User Modal */}
      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass glass-strong view-enter w-full max-w-md rounded-[20px] border border-line p-6 shadow-2xl space-y-4">
            <h3 className="text-[18px] font-black text-ice border-b border-line pb-3">Add Sub-User</h3>

            <div>
              <label className="block text-[12px] font-bold text-steel">Select User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="panel-input mt-1.5 w-full text-[13px]"
              >
                {team.map((u) => (
                  <option key={u.userId} value={u.username}>
                    {u.username} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div className="flex justify-between items-center text-[12px] font-bold">
                <span className="text-steel">Permissions</span>
                <button type="button" onClick={() => toast.info("All permissions selected")} className="text-accent text-[11px]">Select All</button>
              </div>

              {[
                { title: "Start Server", cat: "Power" },
                { title: "Stop Server", cat: "Power" },
                { title: "Restart Server", cat: "Power" },
                { title: "File Management", cat: "Management" },
                { title: "Plugins Management", cat: "Management" },
                { title: "Mods Management", cat: "Management" },
                { title: "Server Settings", cat: "Configuration" },
                { title: "Server Properties", cat: "Configuration" },
                { title: "Backup Management", cat: "Management" },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-[10px] border border-line/60 bg-sunken/60 p-2.5">
                  <div>
                    <div className="text-[12.5px] font-bold text-ice">{p.title}</div>
                    <div className="text-[10px] text-steel">{p.cat}</div>
                  </div>
                  <input type="checkbox" defaultChecked className="size-4 rounded border-line bg-sunken text-accent" />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-[10px] border border-line bg-sunken px-4 py-2 text-[13px] font-bold text-steel">
                Cancel
              </button>
              <button type="button" onClick={handleAddUser} className="rounded-[10px] bg-accent px-5 py-2 text-[13px] font-bold text-white shadow">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Tab 6: Plugins (Image 10 Style) ───────────────────────────────────────────
function PluginsTab({ server }: { server: ServerDto }) {
  const [search, setSearch] = useState("");

  const popular = ["via version", "luckperms", "essentialsx", "worldedit", "vault", "geyser", "chunky", "spark"];

  const plugins = [
    { name: "ViaVersion", author: "kennytv", desc: "Allow newer Java Edition clients to connect to older servers.", tags: ["Bungeecord", "Fabric", "Folia", "Paper"] },
    { name: "ViaVersionStatus", author: "Bobcat00", desc: "Displays players' client versions when they join your server.", tags: ["Bukkit", "Management", "Paper", "Spigot"] },
    { name: "ViaRewind", author: "kennytv", desc: "ViaVersion addon to allow 1.8.x and 1.7.x clients on newer server versions.", tags: ["Bungeecord", "Fabric", "Folia", "Paper"] },
    { name: "ViaAprilFools", author: "florianreuth", desc: "ViaVersion addon to add support for some notable Minecraft snapshots.", tags: ["Cursed", "Fabric", "Folia", "Library"] },
    { name: "GeyserReversion", author: "oryxel", desc: "ViaVersion, but for Bedrock! (GeyserMC).", tags: ["Bedrock", "Geyser"] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[22px] font-black text-ice">Plugin Manager</h2>
          <p className="text-[12px] text-steel">
            Search and install Paper & Spigot plugins powered by <span className="font-bold text-ice">Modrinth</span> with auto-version detection.
          </p>
        </div>

        <div className="flex gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-[10px] bg-ok px-4 py-2 text-[12px] font-extrabold text-white shadow">
            <Search className="size-3.5" /> Discover & Install
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-sunken px-4 py-2 text-[12px] font-bold text-steel">
            Installed (0)
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3 size-4 text-steel" />
          <input
            type="text"
            placeholder="Search plugins on Modrinth (e.g. via version, luckperms, essentials, worldedit)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="panel-input w-full pl-9 text-[13px]"
          />
        </div>
        <button type="button" onClick={() => toast.success("Searching Modrinth...")} className="inline-flex items-center gap-1.5 rounded-[10px] bg-ok px-5 py-2.5 text-[13px] font-bold text-white shadow">
          Search Modrinth
        </button>
      </div>

      {/* Popular Tags */}
      <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
        <span className="text-steel font-bold">Popular:</span>
        {popular.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setSearch(tag)}
            className="rounded-[8px] border border-line bg-sunken px-2.5 py-1 text-[11px] font-semibold text-steel hover:border-line-strong hover:text-ice"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Plugin Cards */}
      <div className="space-y-3">
        {plugins.map((p) => (
          <div key={p.name} className="glass glass-strong flex flex-col justify-between gap-4 rounded-[16px] border border-line p-4 transition-colors hover:border-line-strong sm:flex-row sm:items-center">
            <div className="flex items-start gap-3.5">
              <div className="grid size-11 shrink-0 place-items-center rounded-[12px] border border-ok/30 bg-ok/10 text-ok font-mono font-black">
                VIA
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-extrabold text-ice">{p.name}</h3>
                  <span className="rounded bg-ok/20 border border-ok/40 px-1.5 py-0.2 text-[9px] font-extrabold text-ok uppercase">
                    MODRINTH
                  </span>
                  <span className="text-[11px] text-steel">by {p.author}</span>
                </div>
                <p className="mt-1 text-[12px] text-steel">{p.desc}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded bg-line/80 px-2 py-0.5 text-[10px] font-mono text-steel">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button type="button" onClick={() => toast.info("Viewing versions")} className="inline-flex items-center gap-1 rounded-[10px] border border-line bg-sunken px-3 py-2 text-[12px] font-bold text-steel hover:text-ice">
                Versions & Files
              </button>
              <button type="button" onClick={() => toast.success(`Auto-installing ${p.name}...`)} className="inline-flex items-center gap-1.5 rounded-[10px] bg-ok px-4 py-2 text-[12px] font-bold text-white shadow">
                ⚡ Auto-Install
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 7: Settings (Images 11 & 12 Style) ────────────────────────────────────
function ServerSettingsTab({ server, onRenamed }: { server: ServerDto; onRenamed: (s: ServerDto) => void }) {
  const [softType, setSoftType] = useState("Paper");
  const [softVer, setSoftVersion] = useState("26.3");
  const [javaVer, setJavaVer] = useState("Auto-detect (Java 25 Recommended)");
  const [dockerImg, setDockerImage] = useState("ghcr.io/pterodactyl/yolks:java_21");
  const [serverJar, setServerJar] = useState("paper-26.3-40.jar");
  const [startupCmd, setStartupCommand] = useState("java -Xms128M -Xmx4G -jar paper-26.3-40.jar");
  const [ipAlias, setIpAlias] = useState("");

  const updateRuntime = () => {
    toast.success("Minecraft Runtime updated successfully!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-black text-ice">Settings</h2>
        <p className="text-[12px] text-steel">Manage advanced configuration and dangerous actions for this unit.</p>
      </div>

      {/* Card 1: Runtime Migration & Conversion */}
      <div className="glass glass-strong rounded-[20px] border border-line p-6 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[15px] font-extrabold text-ice">
            <RotateCw className="size-4 text-accent" /> Runtime Migration & Conversion
          </div>
          <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-400 uppercase">
            🔒 MAIN PANEL (LOCKED)
          </span>
        </div>
        <p className="text-[12px] text-steel leading-relaxed">
          Current execution runtime: <span className="font-bold text-accent">DOCKER CONTAINER</span>.
          Runtime migration is disabled on the Main Panel. Server units run on the host engine established during initial panel installation. Runtime switching can only be performed in the Developer Panel (Port 3000) or by reinstalling the panel.
        </p>
        <div className="rounded-[12px] border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-200">
          🔒 Migration controls are locked on the Main Panel to protect production stability.
        </div>
      </div>

      {/* Card 2: Minecraft Runtime */}
      <div className="glass glass-strong rounded-[20px] border border-line p-6 shadow-2xl space-y-4">
        <div>
          <div className="flex items-center gap-2 text-[15px] font-extrabold text-accent">
            <Sliders className="size-4" /> Minecraft Runtime
          </div>
          <p className="mt-1 text-[12px] text-steel">Configure server software, Java version, and Docker image.</p>
          <p className="text-[11px] font-bold text-danger">WARNING: The server MUST be stopped before changing the runtime. A backup will be created automatically.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[12px] font-bold text-steel">Software Type</label>
            <select value={softType} onChange={(e) => setSoftType(e.target.value)} className="panel-input mt-1.5 w-full text-[13px]">
              <option value="Paper">Paper</option>
              <option value="Spigot">Spigot</option>
              <option value="Fabric">Fabric</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-steel">Software Version</label>
            <select value={softVer} onChange={(e) => setSoftVersion(e.target.value)} className="panel-input mt-1.5 w-full text-[13px] font-mono">
              <option value="26.3">26.3 Latest Paper Version</option>
              <option value="1.21.4">1.21.4</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-steel">Java Version</label>
            <select value={javaVer} onChange={(e) => setJavaVer(e.target.value)} className="panel-input mt-1.5 w-full text-[13px]">
              <option value="Auto-detect (Java 25 Recommended)">Auto-detect (Java 25 Recommended)</option>
            </select>
            <div className="mt-2 rounded border border-ok/30 bg-ok/10 p-2 text-[11px] text-ok">
              ⚡ Auto-detection active: Java 25 will be used for 26.3
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-steel">Docker Image</label>
            <input type="text" value={dockerImg} onChange={(e) => setDockerImage(e.target.value)} className="panel-input mt-1.5 w-full font-mono text-[12px]" />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-steel">Server JAR</label>
            <input type="text" value={serverJar} onChange={(e) => setServerJar(e.target.value)} className="panel-input mt-1.5 w-full font-mono text-[12px]" />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-steel">Startup Command</label>
            <input type="text" value={startupCmd} onChange={(e) => setStartupCommand(e.target.value)} className="panel-input mt-1.5 w-full font-mono text-[12px]" />
          </div>
        </div>

        <div className="pt-2 text-right">
          <button type="button" onClick={updateRuntime} className="rounded-[10px] bg-accent px-5 py-2.5 text-[13px] font-bold text-white shadow hover:brightness-110">
            Update Runtime
          </button>
        </div>
      </div>

      {/* Card 3: Server IP Alias */}
      <div className="glass glass-strong rounded-[20px] border border-line p-6 shadow-2xl space-y-3">
        <div className="flex items-center gap-2 text-[15px] font-extrabold text-ice">
          <Globe className="size-4 text-accent" /> Server IP Alias
        </div>
        <p className="text-[12px] text-steel">Set a custom domain or IP to display on the console page.</p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. play.example.com"
            value={ipAlias}
            onChange={(e) => setIpAlias(e.target.value)}
            className="panel-input w-full font-mono text-[13px]"
          />
          <button type="button" onClick={() => toast.success("IP Alias saved!")} className="rounded-[10px] bg-accent px-5 py-2 text-[13px] font-bold text-white shadow shrink-0">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab 8: Backup (Images 16, 17, 18 Style) ───────────────────────────────────
function BackupTab({ server }: { server: ServerDto }) {
  const [backups, setBackups] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCreateBackup = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      const newBkp = {
        name: `backup-${new Date().toISOString().replace(/:/g, "-")}.zip`,
        size: "62.08 MB",
        date: new Date().toLocaleString(),
      };
      setBackups((prev) => [newBkp, ...prev]);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-black text-ice">Server Backups</h2>
        <p className="text-[12px] text-steel">Create, download, and manage your server archives.</p>
      </div>

      {success ? (
        <div className="flex items-center justify-between rounded-[14px] border border-ok/40 bg-ok/10 p-4 text-[13px] font-bold text-ok">
          <span>Backup created successfully.</span>
          <button type="button" onClick={() => setSuccess(false)} className="text-[11px] underline">Dismiss</button>
        </div>
      ) : null}

      {/* Create Backup Card */}
      <div className="glass glass-strong flex flex-col justify-between gap-4 rounded-[20px] border border-line p-6 shadow-2xl sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <div className="grid size-12 shrink-0 place-items-center rounded-[14px] border border-accent/40 bg-accent/10 text-accent">
            <HardDrive className="size-6" />
          </div>
          <div>
            <h3 className="text-[16px] font-extrabold text-ice">Create Backup</h3>
            <p className="mt-1 text-[12px] text-steel">
              All files on the server will be converted into a single zip file. This process may take some time depending on your server&apos;s size.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreateBackup}
          disabled={processing}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-5 py-2.5 text-[13px] font-bold text-white shadow-lg hover:brightness-110 shrink-0 disabled:opacity-50"
        >
          <Plus className="size-4" /> Create Backup
        </button>
      </div>

      {/* Processing Overlay */}
      {processing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass rounded-[20px] border border-line p-8 text-center space-y-3">
            <Spinner className="mx-auto size-8 text-accent" />
            <div className="text-[14px] font-extrabold text-ice">Processing...</div>
          </div>
        </div>
      ) : null}

      {/* Recent Backups */}
      <div className="space-y-3">
        <div className="text-[11px] font-black uppercase tracking-wider text-steel">RECENT BACKUPS</div>

        {backups.length === 0 ? (
          <div className="glass glass-strong rounded-[20px] border border-line p-12 text-center space-y-2">
            <HardDrive className="mx-auto size-8 text-steel" />
            <h3 className="text-[16px] font-bold text-ice">No backups found</h3>
            <p className="text-[12px] text-steel">Create a backup above to secure your files.</p>
          </div>
        ) : (
          backups.map((b, idx) => (
            <div key={idx} className="glass glass-strong flex items-center justify-between rounded-[16px] border border-line p-4">
              <div className="flex items-center gap-3">
                <HardDrive className="size-5 text-accent" />
                <div>
                  <div className="font-mono text-[13px] font-bold text-ice">{b.name}</div>
                  <div className="text-[11px] text-steel">{b.size} • {b.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => toast.success(`Downloading ${b.name}`)} className="inline-flex items-center gap-1 rounded-[10px] border border-line bg-sunken px-3 py-1.5 text-[12px] font-bold text-ice">
                  <Download className="size-3.5" /> Download
                </button>
                <button type="button" onClick={() => setBackups(backups.filter((_, i) => i !== idx))} className="rounded-[10px] border border-line bg-sunken p-2 text-steel hover:text-danger">
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

// ── Deploy Modal Component ──────────────────────────────────────────────────
function DeployModal({ onClose }: { onClose: () => void }) {
  const { setView } = usePanel();
  useEffect(() => {
    setView("deploy");
    onClose();
  }, [setView, onClose]);
  return null;
}
