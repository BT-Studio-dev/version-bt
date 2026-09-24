import { cookies } from "next/headers";
import { ClientGate } from "@/components/panel/client-gate";
import { PanelShell } from "@/components/panel/shell";
import { MODE_COOKIE, parseMode } from "@/lib/panel/theme";
import { DEFAULT_SETTINGS, pickTheme, resolveView } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getBootstrap, getSettings, type UserRow } from "@/lib/server/data";

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let user: UserRow | null = null;
  try {
    user = await getSessionUser();
  } catch {
    user = null;
  }

  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getSettings();
  } catch {
    settings = DEFAULT_SETTINGS;
  }

  if (!user) {
    // No cookie session: the browser may still hold a token (third-party
    // cookies blocked in an embedded preview) — let the client decide.
    return <ClientGate theme={pickTheme(settings)} />;
  }

  let data = null;
  try {
    data = await getBootstrap(user);
  } catch {
    return <ClientGate theme={pickTheme(settings)} />;
  }

  const [params, store] = await Promise.all([searchParams, cookies()]);
  const view = resolveView(params.view, user.role);
  const serverId = view === "servers" && typeof params.server === "string" ? params.server : null;
  return (
    <PanelShell
      initial={data}
      initialView={view}
      initialServerId={serverId}
      initialModeOverride={parseMode(store.get(MODE_COOKIE)?.value)}
    />
  );
}
