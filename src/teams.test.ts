import { test, expect } from "bun:test";

test("postCard requires TEAMS_WEBHOOK_URL", () => {
  expect(process.env.TEAMS_WEBHOOK_URL).toBeDefined();
});
