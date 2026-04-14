import { consola } from "consola";
import { LoginSession, getWhoami, extractCodeFromUrl } from "./kiro";
import { postCard } from "./teams";
import { hostFacts } from "./system";

export async function handleLogin() {
  const config = {
    license: process.env.KIRO_LICENSE ?? "pro",
    identityProvider: process.env.KIRO_IDENTITY_PROVIDER ?? "",
    region: process.env.KIRO_REGION ?? "us-east-1",
  };

  const session = new LoginSession();

  await session.start(config, async (deviceUrl) => {
    const code = extractCodeFromUrl(deviceUrl) ?? "N/A";
    
    try {
      await postCard(
        [
          { type: "TextBlock", text: "🔐 Kiro Login Required", size: "large", weight: "bolder", color: "attention" },
          { type: "TextBlock", text: `Code: **${code}**` },
          { type: "FactSet", facts: hostFacts() },
          { type: "TextBlock", text: "Click the button below to approve the login in your browser." },
        ],
        [{ type: "Action.OpenUrl", url: deviceUrl, title: "Approve Login" }]
      );
      consola.success("Login notification sent to Teams");
    } catch (error) {
      consola.error("Failed to send Teams notification:", error);
    }
  });

  const whoami = await getWhoami();
  
  await postCard([
    { type: "TextBlock", text: "✅ Kiro Login Successful", size: "large", weight: "bolder", color: "good" },
    { type: "TextBlock", text: "🔒 Login approved — button above is no longer valid." },
    { type: "FactSet", facts: hostFacts() },
    { type: "TextBlock", text: whoami.trim(), wrap: true, fontType: "monospace" },
  ]);
  consola.success("Login success notification sent");
}

export function createCheckAndLogin(
  checkLoginFn: () => Promise<boolean>,
  loginFn: () => Promise<void>
) {
  let locked = false;
  return async () => {
    if (locked) return;
    locked = true;
    try {
      consola.info("Checking login status");
      if (!await checkLoginFn()) {
        consola.warn("Not logged in, triggering login");
        await loginFn();
      }
    } finally {
      locked = false;
    }
  };
}
