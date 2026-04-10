const WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL!;

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
  
  if (!response.ok) {
    throw new Error(`Teams webhook failed: ${response.status} ${await response.text()}`);
  }
}
