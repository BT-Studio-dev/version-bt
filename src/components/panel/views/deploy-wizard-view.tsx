"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CodeXml,
  Container,
  Cpu,
  Flame,
  HardDrive,
  Hexagon,
  Lock,
  Pickaxe,
  Rocket,
  Server,
  ShieldCheck,
  Swords,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api, cn } from "@/lib/utils";
import { usePanel } from "../context";

const RAM_PRESETS = [
  { gb: 1, label: "Small Testing Server" },
  { gb: 2, label: "Small Testing Server" },
  { gb: 4, label: "Starter Survival", recommended: true },
  { gb: 8, label: "Medium Survival Server" },
  { gb: 16, label: "Large Community Server" },
  { gb: 24, label: "Heavy Modpack Server" },
  { gb: 32, label: "High-Traffic Network" },
  { gb: 48, label: "Enterprise Workload" },
  { gb: 64, label: "Extreme Performance" },
];

const SOFTWARE_MINECRAFT = [
  { id: "paper", name: "Paper", tag: "High Performance", icon: Pickaxe },
  { id: "spigot", name: "Spigot", tag: "Classic Plugins", icon: Flame },
  { id: "fabric", name: "Fabric", tag: "Lightweight Mods", icon: Pickaxe },
  { id: "forge", name: "Forge", tag: "Classic Modpack", icon: Flame },
  { id: "bungeecord", name: "BungeeCord", tag: "Classic Proxy", icon: Server },
  { id: "velocity", name: "Velocity", tag: "Next-gen Proxy", icon: Server },
];

const SOFTWARE_APPS = [
  { id: "nodejs", name: "Node.js", tag: "Standalone", desc: "JS / TS Runtime & Discord Bots", icon: Hexagon },
  { id: "python", name: "Python", tag: "Standalone", desc: "Python 3.x Runtime & Scripts", icon: CodeXml },
];

export function DeployWizardView() {
  const { profile, team, upsertServer, setView } = usePanel();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [form, setForm] = useState({
    name: "",
    description: "",
    runtime: "docker",
    ramGb: 4,
    cpuLimit: 150,
    diskGb: 10,
    port: 25565,
    ipAlias: "",
    ownerId: profile.userId,
    nodeId: "local",
    software: "paper",
    version: "26.3",
  });

  const [isProvisioning, setIsProvisioning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleNext = () => setStep((s) => Math.min(s + 1, 5) as any);
  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as any);

  const handleLaunch = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter an Instance Name.");
      setStep(1);
      return;
    }

    setIsProvisioning(true);
    setProgress(15);

    try {
      // Simulate progress stages
      await new Promise((r) => setTimeout(r, 400));
      setProgress(48);
      await new Promise((r) => setTimeout(r, 600));
      setProgress(85);

      const created = await api<any>("/api/servers", {
        method: "POST",
        body: {
          name: form.name,
          template: form.software === "paper" ? "minecraft" : form.software,
          port: form.port,
          cpuLimit: form.cpuLimit,
          memoryMb: form.ramGb * 1024,
          diskMb: form.diskGb * 1024,
          ownerId: form.ownerId,
          node: form.nodeId,
        },
      });

      setProgress(100);
      toast.success(`Server "${form.name}" deployed successfully!`);
      upsertServer(created.server || created);
      setTimeout(() => {
        setView("servers");
      }, 500);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create server");
      setIsProvisioning(false);
      setProgress(0);
    }
  };

  const selectedOwner = team.find((u) => u.userId === form.ownerId) || profile;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-accent uppercase">
          <span className="size-2 rounded-full bg-accent" />
          NEW CONTAINER
        </div>
        <h1 className="mt-1 text-[28px] font-black tracking-tight text-ice">DEPLOY INSTANCE</h1>
      </div>

      {/* Stepper Header */}
      <div className="glass glass-strong rounded-[16px] border border-line p-4">
        <div className="flex items-center justify-between">
          {[
            { num: "01", label: "IDENTITY" },
            { num: "02", label: "RESOURCES" },
            { num: "03", label: "ACCESS" },
            { num: "04", label: "SOFTWARE" },
            { num: "05", label: "REVIEW" },
          ].map((s, idx) => {
            const numStep = idx + 1;
            const isDone = step > numStep;
            const isCurrent = step === numStep;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={cn(
                    "grid size-9 place-items-center rounded-[10px] text-[12px] font-black tracking-wider transition-colors",
                    isDone
                      ? "bg-ok text-white"
                      : isCurrent
                        ? "border-2 border-accent bg-accent/20 text-accent shadow-[0_0_12px_rgba(208,0,0,0.4)]"
                        : "border border-line bg-sunken text-steel",
                  )}
                >
                  {isDone ? <Check className="size-4" /> : s.num}
                </div>
                <span
                  className={cn(
                    "hidden text-[11px] font-extrabold tracking-wider uppercase md:inline-block",
                    isCurrent ? "text-ice" : "text-steel",
                  )}
                >
                  {s.label}
                </span>
                {idx < 4 ? <div className="mx-2 hidden h-px w-6 bg-line lg:block" /> : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass glass-strong rounded-[20px] border border-line p-6 shadow-2xl">
        {/* Step 1: IDENTITY */}
        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <span className="text-[12px] font-mono text-steel">01</span>
              <h2 className="text-[18px] font-black uppercase text-ice">IDENTITY</h2>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-ice">Instance Name *</label>
              <input
                type="text"
                placeholder="e.g. Production Survival"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="panel-input mt-1.5 w-full text-[14px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-ice">Description</label>
              <textarea
                rows={3}
                placeholder="Short description of this server (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="panel-input mt-1.5 w-full text-[13px]"
              />
              <p className="mt-1 text-[11px] text-steel">Helps your team identify this instance later.</p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[12px] font-bold text-ice">Execution Runtime</label>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase text-amber-400">
                  <Lock className="size-3" /> MAIN PANEL (LOCKED)
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative rounded-[12px] border-2 border-accent bg-accent/10 p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-ice">Docker Container</span>
                    <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent uppercase">
                      INSTALLED RUNTIME
                    </span>
                  </div>
                  <p className="mt-2 text-[11.5px] text-steel">
                    Isolated sandbox environment with full resource limits and terminal support.
                  </p>
                  <div className="absolute top-3 right-3 grid size-5 place-items-center rounded bg-accent text-white">
                    <Check className="size-3.5" />
                  </div>
                </div>

                <div className="opacity-50 cursor-not-allowed rounded-[12px] border border-line bg-sunken p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-steel">Local Process (Node.js)</span>
                    <span className="rounded bg-line px-2 py-0.5 text-[10px] font-bold text-faint uppercase">
                      DISABLED ON MAIN
                    </span>
                  </div>
                  <p className="mt-2 text-[11.5px] text-steel">
                    Direct system process execution. Ideal for environments without Docker daemon.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[12px] border border-amber-500/30 bg-amber-500/10 p-3.5 text-[12px] text-amber-200">
                <span className="font-bold">Fixed Installation Runtime:</span> Runtime selection is disabled on the
                Main Panel (locked to <span className="font-bold text-amber-300">DOCKER CONTAINER</span>). It can only
                be changed during initial installation or reinstallation (<code className="font-mono">bash install.sh</code>), or switched inside the Developer Panel (Port 3000).
              </div>
            </div>
          </div>
        ) : null}

        {/* Step 2: RESOURCES */}
        {step === 2 ? (
          <div className="space-y-6">
            <div>
              <span className="text-[12px] font-mono text-steel">02</span>
              <h2 className="text-[18px] font-black uppercase text-ice">RESOURCES</h2>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-ice">RAM Allocation (GB)</label>
              <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {RAM_PRESETS.map((r) => {
                  const selected = form.ramGb === r.gb;
                  return (
                    <button
                      key={r.gb}
                      type="button"
                      onClick={() => setForm({ ...form, ramGb: r.gb })}
                      className={cn(
                        "relative rounded-[12px] border p-3.5 text-left transition-all",
                        selected
                          ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(208,0,0,0.3)]"
                          : "border-line bg-sunken hover:border-line-strong",
                      )}
                    >
                      <div className="text-[20px] font-black text-ice">
                        {r.gb} <span className="text-[12px] font-bold text-steel">GB</span>
                      </div>
                      <div className="mt-1 text-[11px] font-medium text-steel truncate">{r.label}</div>
                      {selected ? (
                        <div className="absolute top-2.5 right-2.5 grid size-4 place-items-center rounded bg-accent text-white">
                          <Check className="size-3" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[12px] font-bold text-ice">CPU Limit (%)</label>
                <div className="mt-1.5 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={form.cpuLimit}
                      onChange={(e) => setForm({ ...form, cpuLimit: parseInt(e.target.value) || 100 })}
                      className="panel-input w-full font-mono pr-8"
                    />
                    <span className="absolute top-2.5 right-3 text-[12px] text-steel">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, cpuLimit: Math.min(600, form.ramGb * 50) })}
                    className="inline-flex items-center gap-1 rounded-[10px] bg-white px-3 py-2 text-[12px] font-extrabold text-black transition-transform hover:scale-[1.02]"
                  >
                    <Zap className="size-3.5" /> AUTO
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-steel">Auto-optimized for {form.ramGb}GB</p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-ice">Disk Limit (GB)</label>
                <input
                  type="number"
                  value={form.diskGb}
                  onChange={(e) => setForm({ ...form, diskGb: parseInt(e.target.value) || 10 })}
                  className="panel-input mt-1.5 w-full font-mono"
                />
                <p className="mt-1 text-[11px] text-steel">Storage space allocated to this server.</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Step 3: ACCESS */}
        {step === 3 ? (
          <div className="space-y-6">
            <div>
              <span className="text-[12px] font-mono text-steel">03</span>
              <h2 className="text-[18px] font-black uppercase text-ice">NETWORK & ACCESS</h2>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-ice">Server Port</label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 25565 })}
                  className="panel-input w-full font-mono border-ok/50 focus:border-ok"
                />
                <span className="absolute top-2.5 right-3 font-mono text-[10px] font-extrabold text-ok uppercase tracking-wider">
                  AVAILABLE
                </span>
              </div>
              <p className="mt-1 text-[11px] text-steel">The main port the server will bind to. Must not be in use.</p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-ice">IP Alias</label>
              <input
                type="text"
                placeholder="play.example.com"
                value={form.ipAlias}
                onChange={(e) => setForm({ ...form, ipAlias: e.target.value })}
                className="panel-input mt-1.5 w-full font-mono"
              />
              <p className="mt-1 text-[11px] text-steel">Optional custom domain or subdomain used to access your server.</p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-ice">Assign Server Owner</label>
              <select
                value={form.ownerId}
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                className="panel-input mt-1.5 w-full cursor-pointer"
              >
                {team.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.username} ({u.role})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-steel">Select which user owns and has access to this server.</p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-ice">Deployment Node</label>
              <select
                value={form.nodeId}
                onChange={(e) => setForm({ ...form, nodeId: e.target.value })}
                className="panel-input mt-1.5 w-full cursor-pointer"
              >
                <option value="local">Built-in Node (Local) (127.0.0.1)</option>
              </select>
              <p className="mt-1 text-[11px] text-steel">Physical node this container will be deployed to.</p>
            </div>
          </div>
        ) : null}

        {/* Step 4: SOFTWARE */}
        {step === 4 ? (
          <div className="space-y-6">
            <div>
              <span className="text-[12px] font-mono text-steel">04</span>
              <h2 className="text-[18px] font-black uppercase text-ice">SOFTWARE</h2>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-wider text-steel">04A MINECRAFT ENGINES</div>
              <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SOFTWARE_MINECRAFT.map((item) => {
                  const Icon = item.icon;
                  const selected = form.software === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForm({ ...form, software: item.id })}
                      className={cn(
                        "relative rounded-[14px] border p-4 text-center transition-all",
                        selected
                          ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(208,0,0,0.3)]"
                          : "border-line bg-sunken hover:border-line-strong",
                      )}
                    >
                      <Icon className="mx-auto size-6 text-accent" />
                      <div className="mt-2 text-[14px] font-extrabold text-ice">{item.name}</div>
                      <div className="mt-0.5 text-[11px] font-medium text-steel">{item.tag}</div>
                      {selected ? (
                        <div className="absolute top-2 right-2 grid size-4 place-items-center rounded bg-accent text-white">
                          <Check className="size-3" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-steel">
                04B APPLICATION & SCRIPT RUNTIMES
                <span className="rounded bg-line px-1.5 py-0.5 text-[10px] text-faint">NON-MINECRAFT</span>
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SOFTWARE_APPS.map((item) => {
                  const Icon = item.icon;
                  const selected = form.software === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForm({ ...form, software: item.id })}
                      className={cn(
                        "relative flex items-center gap-3 rounded-[14px] border p-4 text-left transition-all",
                        selected
                          ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(208,0,0,0.3)]"
                          : "border-line bg-sunken hover:border-line-strong",
                      )}
                    >
                      <div className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-fill text-accent">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-extrabold text-ice">{item.name}</span>
                          <span className="rounded bg-line/80 px-1.5 py-0.2 text-[10px] font-bold text-steel">
                            {item.tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-steel">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-ice">Software Version</label>
              <select
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="panel-input mt-1.5 w-full cursor-pointer font-mono"
              >
                <option value="26.3">26.3 (Latest Version)</option>
                <option value="1.21.4">1.21.4 (Stable)</option>
                <option value="1.20.4">1.20.4 (LTS)</option>
              </select>
            </div>

            <div className="rounded-[12px] border border-ok/30 bg-ok/10 p-3.5 text-[12px] text-ok">
              ⚡ <span className="font-bold">Java Auto-detect:</span> Java 25 will be automatically provisioned
            </div>
          </div>
        ) : null}

        {/* Step 5: REVIEW */}
        {step === 5 ? (
          <div className="space-y-6">
            <div>
              <span className="text-[12px] font-mono text-steel">05</span>
              <h2 className="text-[18px] font-black uppercase text-ice">FINAL SPECIFICATION</h2>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-line bg-sunken">
              <table className="w-full text-left text-[13px]">
                <tbody className="divide-y divide-line/60">
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">INSTANCE</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-ice">{form.name || "Untitled"}</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">RUNTIME</td>
                    <td className="px-4 py-2.5 font-bold text-ice">Docker</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">DESCRIPTION</td>
                    <td className="px-4 py-2.5 text-steel">{form.description || "—"}</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">PORT</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-ice">{form.port}</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">RAM</td>
                    <td className="px-4 py-2.5 font-bold text-ice">{form.ramGb} GB</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">CPU (AUTO)</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-ice">{form.cpuLimit} %</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">DISK</td>
                    <td className="px-4 py-2.5 font-bold text-ice">{form.diskGb} GB</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">IP ALIAS</td>
                    <td className="px-4 py-2.5 font-mono text-steel">{form.ipAlias || "—"}</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">OWNER ID</td>
                    <td className="px-4 py-2.5 font-mono text-steel">{selectedOwner.userId}</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">NODE ID</td>
                    <td className="px-4 py-2.5 font-mono text-steel">local</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">SOFTWARE</td>
                    <td className="px-4 py-2.5 font-bold text-ice capitalize">{form.software}</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">VERSION</td>
                    <td className="px-4 py-2.5 font-mono text-ice">{form.version}</td>
                  </tr>
                  <tr className="hover:bg-fill/30">
                    <td className="px-4 py-2.5 font-bold uppercase text-steel">JAVA RUNTIME</td>
                    <td className="px-4 py-2.5 text-ok">Java 25 (Auto-detected)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {isProvisioning ? (
              <div className="space-y-2 rounded-[14px] border border-line bg-sunken p-4">
                <div className="flex justify-between text-[12px] font-bold text-ice">
                  <span>Provisioning container...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-fill">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Wizard Footer Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-line pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isProvisioning}
              className="rounded-[10px] border border-line bg-sunken px-5 py-2.5 text-[13px] font-bold text-steel hover:text-ice disabled:opacity-50"
            >
              ← BACK
            </button>
          ) : (
            <div />
          )}

          <div className="text-[12px] font-mono text-steel">STEP {step} / 5</div>

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-white px-6 py-2.5 text-[13px] font-black text-black shadow-lg hover:brightness-110 active:scale-95"
            >
              NEXT →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isProvisioning}
              className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-6 py-2.5 text-[13px] font-black text-white shadow-xl hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <Rocket className="size-4" /> LAUNCH 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
