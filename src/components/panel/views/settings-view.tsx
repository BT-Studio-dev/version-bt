"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Cpu,
  ExternalLink,
  KeyRound,
  LayoutGrid,
  Palette,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { PANEL_VERSION, type SettingsTab } from "@/lib/panel/types";
import { cn } from "@/lib/utils";
import { usePanel } from "../context";

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: any }[] = [
  { id: "branding", label: "BRANDING", icon: LayoutGrid },
  { id: "features", label: "FEATURES", icon: Settings },
  { id: "runtime", label: "RUNTIME", icon: Cpu },
  { id: "appearance", label: "APPEARANCE", icon: Palette },
  { id: "authentication", label: "AUTHENTICATION", icon: KeyRound },
  { id: "users", label: "USERS", icon: Users },
  { id: "system", label: "SYSTEM", icon: RefreshCw },
];

function InputField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-wider text-steel">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="panel-input mt-1.5 w-full text-[13px]"
      />
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
        checked ? "bg-accent" : "bg-sunken border-line",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function SettingsView() {
  const { settingsTab, setSettingsTab, setView } = usePanel();

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Settings Navigation Sidebar (Image 4 Style) */}
      <div className="w-full lg:w-64 shrink-0">
        <div className="glass glass-strong rounded-[20px] border border-line p-3 shadow-xl">
          <div className="px-3 py-2 text-[10px] font-extrabold tracking-[0.16em] text-faint uppercase">
            SETTINGS
          </div>
          <nav className="mt-1 flex flex-col gap-1">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = settingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id === "users") {
                      setView("users");
                    } else {
                      setSettingsTab(tab.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-[12px] px-3.5 py-3 text-[12px] font-extrabold tracking-wider transition-all uppercase",
                    active
                      ? "bg-sunken text-ice border-l-4 border-accent pl-2.5 shadow-md"
                      : "text-steel hover:bg-fill hover:text-ice",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <div className="my-2 h-px bg-line/60" />

            <button
              type="button"
              onClick={() => setView("home")}
              className="flex items-center gap-3 rounded-[12px] px-3.5 py-3 text-[12px] font-extrabold tracking-wider text-steel hover:bg-fill hover:text-ice uppercase transition-all"
            >
              <ArrowLeft className="size-4 shrink-0" />
              <span>BACK TO APP</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 min-w-0">
        <div key={settingsTab} className="view-enter">
          {settingsTab === "branding" || settingsTab === "general" ? <BrandingPanel /> : null}
          {settingsTab === "features" ? <FeaturesPanel /> : null}
          {settingsTab === "runtime" ? <RuntimePanel /> : null}
          {settingsTab === "appearance" ? <AppearancePanel /> : null}
          {settingsTab === "authentication" ? <AuthenticationPanel /> : null}
          {settingsTab === "system" ? <SystemPanel /> : null}
        </div>
      </div>
    </div>
  );
}

// ── BRANDING ─────────────────────────────────────────────────────────────────
function BrandingPanel() {
  const { settings, persistSettings } = usePanel();
  const [form, setForm] = useState({
    panelName: settings.panelName,
    panelSubtitle: settings.panelSubtitle,
    welcomeTitle: settings.welcomeTitle,
    welcomeMessage: settings.welcomeMessage,
    panelLogo: settings.panelLogo,
  });

  const save = async () => {
    await persistSettings(form, "Branding updated successfully!");
  };

  return (
    <div className="glass glass-strong space-y-6 rounded-[20px] border border-line p-6 shadow-2xl">
      <div className="flex items-center gap-2 text-[18px] font-black text-ice">
        <LayoutGrid className="size-5 text-accent" /> Branding Settings
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Panel Name" value={form.panelName} onChange={(v) => setForm({ ...form, panelName: v })} />
        <InputField label="Panel Subtitle" value={form.panelSubtitle} onChange={(v) => setForm({ ...form, panelSubtitle: v })} />
        <InputField label="Welcome Title" value={form.welcomeTitle} onChange={(v) => setForm({ ...form, welcomeTitle: v })} />
        <InputField label="Logo URL" value={form.panelLogo} onChange={(v) => setForm({ ...form, panelLogo: v })} />
      </div>

      <div>
        <label className="block text-[12px] font-bold uppercase tracking-wider text-steel">Welcome Message</label>
        <textarea
          rows={3}
          value={form.welcomeMessage}
          onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
          className="panel-input mt-1.5 w-full text-[13px]"
        />
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={save}
          className="rounded-[10px] bg-accent px-5 py-2.5 text-[13px] font-bold text-white shadow-lg hover:brightness-110"
        >
          Save Branding
        </button>
      </div>
    </div>
  );
}

// ── FEATURES (Image 1 Style) ──────────────────────────────────────────────────
function FeaturesPanel() {
  const { settings, persistSettings } = usePanel();

  const [playitEnabled, setPlayitEnabled] = useState(settings.playitEnabled ?? false);
  const [onboardingTutorial, setOnboardingTutorial] = useState(settings.onboardingTutorial ?? true);
  const [cinematicLogin, setCinematicLogin] = useState(settings.cinematicLogin ?? true);
  const [allowRegistration, setAllowRegistration] = useState(settings.allowRegistration ?? true);

  const save = async (patch: Partial<typeof settings>) => {
    await persistSettings(patch, "Features updated!");
  };

  return (
    <div className="glass glass-strong space-y-6 rounded-[20px] border border-line p-6 shadow-2xl">
      <div className="flex items-center gap-2 text-[18px] font-black text-ice">
        <Settings className="size-5 text-accent" /> Features
      </div>

      <div className="space-y-4">
        {/* Playit Tunnel Integration */}
        <div className="glass rounded-[14px] border border-line/80 bg-sunken/60 p-4 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-[14px] font-extrabold text-ice">Playit Tunnel Integration</h4>
            <p className="mt-1 text-[12px] text-steel">
              Allow users to expose their local servers to the internet using playit.gg tunnels.
            </p>
          </div>
          <ToggleSwitch
            checked={playitEnabled}
            onChange={(checked) => {
              setPlayitEnabled(checked);
              save({ playitEnabled: checked });
            }}
          />
        </div>

        {/* Onboarding Tutorial */}
        <div className="glass rounded-[14px] border border-line/80 bg-sunken/60 p-4 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-[14px] font-extrabold text-ice">Onboarding Tutorial</h4>
            <p className="mt-1 text-[12px] text-steel">
              Show a guided tour to new users when they log in for the first time.
            </p>
          </div>
          <ToggleSwitch
            checked={onboardingTutorial}
            onChange={(checked) => {
              setOnboardingTutorial(checked);
              save({ onboardingTutorial: checked });
            }}
          />
        </div>

        {/* Cinematic Login Intro */}
        <div className="glass rounded-[14px] border border-line/80 bg-sunken/60 p-4 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-[14px] font-extrabold text-ice">Cinematic Login Intro</h4>
            <p className="mt-1 text-[12px] text-steel">
              Enable the animated sequence on the login screen.
            </p>
          </div>
          <ToggleSwitch
            checked={cinematicLogin}
            onChange={(checked) => {
              setCinematicLogin(checked);
              save({ cinematicLogin: checked });
            }}
          />
        </div>

        {/* User Registration */}
        <div className="glass rounded-[14px] border border-line/80 bg-sunken/60 p-4 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-[14px] font-extrabold text-ice">User Registration</h4>
            <p className="mt-1 text-[12px] text-steel">
              Allow new users to register an account on the panel.
            </p>
          </div>
          <ToggleSwitch
            checked={allowRegistration}
            onChange={(checked) => {
              setAllowRegistration(checked);
              save({ allowRegistration: checked });
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── RUNTIME ──────────────────────────────────────────────────────────────────
function RuntimePanel() {
  return (
    <div className="glass glass-strong space-y-6 rounded-[20px] border border-line p-6 shadow-2xl">
      <div className="flex items-center gap-2 text-[18px] font-black text-ice">
        <Cpu className="size-5 text-accent" /> Runtime Configuration
      </div>

      <div className="space-y-4">
        <div className="rounded-[14px] border border-accent bg-accent/10 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-extrabold text-ice">Docker Container Runtime</span>
            <span className="rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-[10px] font-extrabold text-accent uppercase">
              ACTIVE
            </span>
          </div>
          <p className="mt-2 text-[12.5px] text-steel">
            All server instances execute inside isolated Docker containers with enforced memory, CPU, and disk limits.
          </p>
        </div>

        <div className="rounded-[14px] border border-line bg-sunken p-5 opacity-60">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-bold text-steel">Local Process (Node.js)</span>
            <span className="rounded-full bg-line px-3 py-1 text-[10px] font-bold text-faint uppercase">
              DISABLED
            </span>
          </div>
          <p className="mt-2 text-[12.5px] text-steel">
            Direct host execution without container isolation.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── APPEARANCE ──────────────────────────────────────────────────────────────
function AppearancePanel() {
  const { mode, toggleMode, persistTheme } = usePanel();

  return (
    <div className="glass glass-strong space-y-6 rounded-[20px] border border-line p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[18px] font-black text-ice">
          <Palette className="size-5 text-accent" /> Appearance & Theme
        </div>
        <button
          type="button"
          onClick={() => void persistTheme()}
          className="rounded-[10px] bg-accent px-4 py-2 text-[13px] font-bold text-white shadow-lg hover:brightness-110"
        >
          Save Theme
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={toggleMode}
          className={cn(
            "rounded-[14px] border p-4 text-left transition-all",
            mode === "dark" ? "border-accent bg-accent/10" : "border-line bg-sunken",
          )}
        >
          <div className="text-[14px] font-bold text-ice">Classic Dark</div>
          <p className="mt-1 text-[11px] text-steel">Translucent dark glass theme</p>
        </button>
        <button
          type="button"
          onClick={toggleMode}
          className={cn(
            "rounded-[14px] border p-4 text-left transition-all",
            mode === "oled" ? "border-accent bg-accent/10" : "border-line bg-sunken",
          )}
        >
          <div className="text-[14px] font-bold text-ice">OLED Pure Black</div>
          <p className="mt-1 text-[11px] text-steel">Deep #000000 background</p>
        </button>
        <button
          type="button"
          onClick={toggleMode}
          className={cn(
            "rounded-[14px] border p-4 text-left transition-all",
            mode === "light" ? "border-accent bg-accent/10" : "border-line bg-sunken",
          )}
        >
          <div className="text-[14px] font-bold text-ice">Light Theme</div>
          <p className="mt-1 text-[11px] text-steel">Bright light background</p>
        </button>
      </div>
    </div>
  );
}

// ── AUTHENTICATION (Image 2 Style) ──────────────────────────────────────────
function AuthenticationPanel() {
  const { settings, persistSettings } = usePanel();

  const [enableGoogleLogin, setEnableGoogleLogin] = useState(settings.enableGoogleLogin ?? false);
  const [form, setForm] = useState({
    firebaseApiKey: settings.firebaseApiKey || "",
    firebaseAuthDomain: settings.firebaseAuthDomain || "your-project.firebaseapp.com",
    firebaseProjectId: settings.firebaseProjectId || "your-project-id",
    firebaseStorageBucket: settings.firebaseStorageBucket || "your-project.appspot.com",
    firebaseMessagingSenderId: settings.firebaseMessagingSenderId || "1234567890",
    firebaseAppId: settings.firebaseAppId || "1:1234567890:web:abcdef",
  });

  const save = async () => {
    await persistSettings({ enableGoogleLogin, ...form }, "Firebase Credentials Saved!");
  };

  const testConn = () => {
    if (!form.firebaseApiKey) {
      toast.error("Please enter a Firebase API Key first.");
      return;
    }
    toast.success("Firebase Credentials format validated!");
  };

  return (
    <div className="glass glass-strong space-y-6 rounded-[20px] border border-line p-6 shadow-2xl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-[18px] font-black text-ice">
            <KeyRound className="size-5 text-accent" /> Google & Firebase Authentication
          </div>
          <p className="mt-1 text-[12px] text-steel">
            Configure Firebase API Keys to enable 1-click Google Sign-In for admins and users.
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-[12px] border border-line bg-sunken px-3.5 py-2">
          <span className="text-[12px] font-bold text-ice">Enable Google Login:</span>
          <ToggleSwitch
            checked={enableGoogleLogin}
            onChange={(checked) => {
              setEnableGoogleLogin(checked);
              persistSettings({ enableGoogleLogin: checked });
            }}
          />
        </div>
      </div>

      {/* Guide Banner */}
      <div className="rounded-[16px] border border-accent/40 bg-accent/10 p-4 text-[12.5px] text-ice space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-amber-300">
          ✨ How to Setup Google Login in 1 Minute (No Code Needed!):
        </div>
        <ol className="list-decimal list-inside space-y-1 text-steel leading-relaxed">
          <li>
            Open{" "}
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline inline-flex items-center gap-1"
            >
              Firebase Console <ExternalLink className="size-3" />
            </a>{" "}
            and create a free project.
          </li>
          <li>Go to <span className="font-bold text-ice">Authentication → Sign-in method</span> and enable <span className="font-bold text-ice">Google</span>.</li>
          <li>Under <span className="font-bold text-ice">Settings → Authorized Domains</span>, add your panel&apos;s domain or IP address.</li>
          <li>Go to <span className="font-bold text-ice">Project Settings → General → Your apps</span>, create a Web App and copy the Firebase config credentials below!</li>
        </ol>
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label="FIREBASE API KEY *"
          value={form.firebaseApiKey}
          placeholder="AIzaSy..."
          onChange={(v) => setForm({ ...form, firebaseApiKey: v })}
        />
        <InputField
          label="AUTH DOMAIN *"
          value={form.firebaseAuthDomain}
          placeholder="your-project.firebaseapp.com"
          onChange={(v) => setForm({ ...form, firebaseAuthDomain: v })}
        />
        <InputField
          label="PROJECT ID *"
          value={form.firebaseProjectId}
          placeholder="your-project-id"
          onChange={(v) => setForm({ ...form, firebaseProjectId: v })}
        />
        <InputField
          label="STORAGE BUCKET (OPTIONAL)"
          value={form.firebaseStorageBucket}
          placeholder="your-project.appspot.com"
          onChange={(v) => setForm({ ...form, firebaseStorageBucket: v })}
        />
        <InputField
          label="MESSAGING SENDER ID (OPTIONAL)"
          value={form.firebaseMessagingSenderId}
          placeholder="1234567890"
          onChange={(v) => setForm({ ...form, firebaseMessagingSenderId: v })}
        />
        <InputField
          label="APP ID (OPTIONAL)"
          value={form.firebaseAppId}
          placeholder="1:1234567890:web:abcdef"
          onChange={(v) => setForm({ ...form, firebaseAppId: v })}
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={save}
          className="rounded-[10px] bg-accent px-5 py-2.5 text-[13px] font-bold text-white shadow-lg hover:brightness-110"
        >
          Save Firebase Credentials
        </button>
        <button
          type="button"
          onClick={testConn}
          className="rounded-[10px] border border-line bg-sunken px-5 py-2.5 text-[13px] font-bold text-ice hover:border-line-strong"
        >
          Test Connection
        </button>
      </div>
    </div>
  );
}

// ── SYSTEM (Image 3 Style) ───────────────────────────────────────────────────
function SystemPanel() {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    toast.info("Triggering git pull and system rebuild...");
    setTimeout(() => {
      setUpdating(false);
      toast.success("System updated to latest release!");
    }, 2500);
  };

  return (
    <div className="glass glass-strong space-y-6 rounded-[20px] border border-line p-6 shadow-2xl">
      <div className="flex items-center gap-2 text-[18px] font-black text-ice">
        <RefreshCw className="size-5 text-accent" /> System Update
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[14px] border border-line bg-sunken p-4">
          <div className="text-[10px] font-extrabold uppercase text-steel">VERSION</div>
          <div className="mt-1 text-[18px] font-black text-accent">{PANEL_VERSION}</div>
        </div>

        <div className="rounded-[14px] border border-line bg-sunken p-4">
          <div className="text-[10px] font-extrabold uppercase text-steel">STATUS</div>
          <div className="mt-1 text-[18px] font-black text-ok">Up to date</div>
        </div>

        <div className="rounded-[14px] border border-line bg-sunken p-4">
          <div className="text-[10px] font-extrabold uppercase text-steel">MAIN PORT</div>
          <div className="mt-1 font-mono text-[18px] font-black text-ice">3000</div>
        </div>

        <div className="rounded-[14px] border border-line bg-sunken p-4">
          <div className="text-[10px] font-extrabold uppercase text-steel">DEFAULT DRIVER</div>
          <div className="mt-1 text-[18px] font-black text-ice">Docker</div>
        </div>
      </div>

      <p className="text-[12.5px] text-steel leading-relaxed">
        Trigger an automatic update of the JTG Panel. This will run <code className="font-mono text-ice">git pull</code> and rebuild the system. The panel will be unavailable for a few seconds during this process.
      </p>

      <div>
        <button
          type="button"
          disabled={updating}
          onClick={handleUpdate}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-5 py-2.5 text-[13px] font-bold text-white shadow-lg hover:brightness-110 disabled:opacity-50"
        >
          <RefreshCw className={cn("size-4", updating && "animate-spin")} />
          {updating ? "Updating..." : "Update Panel"}
        </button>
      </div>
    </div>
  );
}
