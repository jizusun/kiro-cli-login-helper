import { consola } from "consola";
import { LoginSession, getWhoami, extractCodeFromUrl } from "./kiro";
import { postCard } from "./teams";
import { hostFacts } from "./system";
import { acquireLock, releaseLock } from "./lock";

export function killExistingLogins() {
  try {
    const result = Bun.spawnSync(["pkill", "-f", "kiro-cli login"]);
    if (result.exitCode === 0) consola.info("Killed existing kiro-cli login process(es)");
  } catch {}
}

export async function handleLogin(watch = false, expiresMs = 600000): Promise<boolean> {
  if (!acquireLock()) {
    consola.warn("Another login process is active, skipping");
    return false;
  }

  killExistingLogins();

  const config = {
    license: process.env.KIRO_LICENSE ?? "pro",
    identityProvider: process.env.KIRO_IDENTITY_PROVIDER ?? "",
    region: process.env.KIRO_REGION ?? "us-east-1",
  };

  const session = new LoginSession();

  try {
    const exitCode = await session.start(config, expiresMs, async (deviceUrl) => {
      const code = extractCodeFromUrl(deviceUrl) ?? "N/A";
      const mode = watch ? "watch" : "on-demand";
      const expiresAt = new Date(Date.now() + expiresMs).toLocaleTimeString();
      const body: object[] = [
        { type: "TextBlock", text: "🔐 Kiro Login Required", size: "large", weight: "bolder", color: "attention" },
        { type: "TextBlock", text: `Code: **${code}**` },
        { type: "FactSet", facts: [...hostFacts(), { title: "Mode", value: mode }] },
        { type: "TextBlock", text: `⏰ Code expires at **${expiresAt}**`, color: "warning", wrap: true },
        { type: "TextBlock", text: "Click the button below to approve the login in your browser.", wrap: true },
      ];
      try {
        await postCard(body, [{ type: "Action.OpenUrl", url: deviceUrl, title: "Approve Login" }]);
        consola.success("Login notification sent to Teams");
      } catch (error) {
        consola.error("Failed to send Teams notification:", error);
      }
    });

    if (exitCode !== 0) {
      consola.warn("Login process exited with code", exitCode, "— skipping success notification");
      return false;
    }

    const whoami = await getWhoami();
    const mode = watch ? "watch" : "on-demand";
    try {
      await postCard([
        { type: "TextBlock", text: "✅ Kiro Login Successful", size: "large", weight: "bolder", color: "good" },
        { type: "TextBlock", text: "🔒 Login approved — button above is no longer valid." },
        { type: "FactSet", facts: [...hostFacts(), { title: "Mode", value: mode }] },
        { type: "TextBlock", text: whoami.trim(), wrap: true, fontType: "monospace" },
      ]);
      consola.success("Login success notification sent");
    } catch (error) {
      consola.error("Failed to send Teams success notification:", error);
    }
    return true;
  } finally {
    releaseLock();
  }
}

export function createCheckAndLogin(
  checkLoginFn: () => Promise<boolean>,
  loginFn: (watch?: boolean, expiresMs?: number) => Promise<boolean>,
  watch = false,
  intervalMs = 0,
  expiresMs = 600000,
) {
  let locked = false;

  return async () => {
    if (locked) return;
    locked = true;
    const nextCheck = watch ? ` · next check at ${new Date(Date.now() + intervalMs).toLocaleTimeString()}` : "";
    try {
      consola.info("Checking login status");
      if (await checkLoginFn()) {
        consola.success(`Already logged in${nextCheck}`);
        return;
      }

      consola.warn("Not logged in, triggering login");
      await loginFn(watch, expiresMs);
      if (watch) consola.info(`Next check at ${new Date(Date.now() + intervalMs).toLocaleTimeString()}`);
    } finally {
      locked = false;
    }
  };
}
