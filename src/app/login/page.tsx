import { redirect } from "next/navigation";
import { AuthEntry } from "@/components/auth/auth-entry";
import { DEFAULT_SETTINGS, DEMO_ACCOUNTS, pickTheme } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getSettings, getUserById } from "@/lib/server/data";

export default async function LoginPage() {
  let user = null;
  try {
    user = await getSessionUser();
  } catch {}
  if (user) redirect("/");

  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getSettings();
  } catch {}

  let demoOwner = null;
  try {
    demoOwner = settings.showDemoLogin ? await getUserById(DEMO_ACCOUNTS[0].id) : null;
  } catch {}

  return (
    <AuthEntry
      mode="login"
      theme={pickTheme(settings)}
      panelName={settings.panelName}
      panelLogo={settings.panelLogo}
      title="Sign In to {panel}"
      subtitle="Enter your credentials to access your servers"
      allowRegistration={settings.allowRegistration}
      demos={demoOwner ? DEMO_ACCOUNTS : []}
    />
  );
}
