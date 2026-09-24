import { redirect } from "next/navigation";
import { AuthEntry } from "@/components/auth/auth-entry";
import { DEFAULT_SETTINGS, pickTheme } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { countUsers, getSettings } from "@/lib/server/data";

export default async function RegisterPage() {
  let user = null;
  try {
    user = await getSessionUser();
  } catch {}
  if (user) redirect("/");

  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getSettings();
  } catch {}

  let firstUser = true;
  try {
    firstUser = (await countUsers()) === 0;
  } catch {}

  const open = firstUser || settings.allowRegistration;
  return (
    <AuthEntry
      mode="register"
      theme={pickTheme(settings)}
      panelName={settings.panelName}
      panelLogo={settings.panelLogo}
      title={firstUser ? "Create the owner account" : "Join {panel}"}
      subtitle={
        firstUser
          ? "The first account becomes the panel owner"
          : "Create a member account to manage your servers"
      }
      registrationOpen={open}
      firstUser={firstUser}
    />
  );
}
