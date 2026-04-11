import { mkdirSync } from "fs";

const WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL!;
const LOGS_DIR = "logs";

mkdirSync(LOGS_DIR, { recursive: true });

async function logRequestResponse(payload: object, status: number, responseBody: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const entry = { timestamp: new Date().toISOString(), request: payload, response: { status, body: responseBody } };
  await Bun.write(`${LOGS_DIR}/${ts}.json`, JSON.stringify(entry, null, 2));
}

export async function postCard(body: object[], actions?: object[]) {
  const payload = {
    type: "message",
    attachments: [{
      contentType: "application/vnd.microsoft.card.adaptive",
      content: { type: "AdaptiveCard", version: "1.0", body, actions },
    }],
  };
  
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  const responseBody = await response.text();
  await logRequestResponse(payload, response.status, responseBody);

  if (!response.ok) {
    throw new Error(`Teams webhook failed: ${response.status} ${responseBody}`);
  }
}
