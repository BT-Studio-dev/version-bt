"use client";

import { useState } from "react";
import { Copy, Key, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type ApiKey = {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  lastUsed: string;
};

export function ApiKeysView() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a key name.");
      return;
    }
    const token = `btp_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name,
      token,
      createdAt: new Date().toLocaleDateString(),
      lastUsed: "Never",
    };
    setKeys((prev) => [...prev, newKey]);
    setCreatedToken(token);
    toast.success(`API Key "${name}" generated!`);
  };

  const handleDelete = (id: string, keyName: string) => {
    if (!confirm(`Delete API key "${keyName}"?`)) return;
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("API key deleted.");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API Token copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-accent uppercase">
          <span className="size-2 rounded-full bg-accent" />
          CORE — ACCESS MANAGEMENT
        </div>
        <h1 className="mt-1 text-[32px] font-black tracking-tight text-ice">API KEYS</h1>
      </div>

      {/* Main Container */}
      <div className="glass glass-strong rounded-[20px] border border-line p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2 text-[16px] font-extrabold text-ice">
            <Key className="size-5 text-accent" /> API Keys
          </div>
          <button
            type="button"
            onClick={() => {
              setName("");
              setCreatedToken(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-4 py-2 text-[13px] font-bold text-white shadow-lg hover:brightness-110"
          >
            <Plus className="size-4" /> Generate Key
          </button>
        </div>

        <div className="mt-6">
          {keys.length === 0 ? (
            <div className="py-12 text-center text-[14px] font-semibold text-steel">
              No API keys generated yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line text-[11px] font-extrabold uppercase tracking-wider text-steel">
                    <th className="py-3 px-4">NAME</th>
                    <th className="py-3 px-4">TOKEN</th>
                    <th className="py-3 px-4">CREATED</th>
                    <th className="py-3 px-4">LAST USED</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-fill/30">
                      <td className="py-3 px-4 font-bold text-ice">{k.name}</td>
                      <td className="py-3 px-4 font-mono text-steel">
                        {k.token.slice(0, 10)}••••••••
                      </td>
                      <td className="py-3 px-4 text-steel">{k.createdAt}</td>
                      <td className="py-3 px-4 text-steel">{k.lastUsed}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(k.id, k.name)}
                          className="inline-flex size-8 items-center justify-center rounded-[8px] border border-line bg-sunken text-steel hover:text-danger"
                          title="Delete API Key"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Generate Key Modal */}
      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass glass-strong view-enter w-full max-w-md rounded-[20px] border border-line p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h3 className="text-[18px] font-black text-ice">Generate API Key</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-steel hover:text-ice"
              >
                <X className="size-5" />
              </button>
            </div>

            {createdToken ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[12px] border border-ok/30 bg-ok/10 p-4 text-[13px] text-ok">
                  <span className="font-bold">Key Generated!</span> Copy your token now. You won&apos;t be able to see it again!
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-steel">API Token</label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdToken}
                      className="panel-input w-full font-mono text-[12px]"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdToken)}
                      className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-3 py-2 text-[12px] font-bold text-white shrink-0"
                    >
                      <Copy className="size-4" /> Copy
                    </button>
                  </div>
                </div>
                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-[10px] border border-line bg-sunken px-5 py-2 text-[13px] font-bold text-ice"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-steel">Key Name</label>
                  <input
                    type="text"
                    placeholder="e.g. CLI Deployer / Discord Bot Integration"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="panel-input mt-1.5 w-full"
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
                    Generate Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
