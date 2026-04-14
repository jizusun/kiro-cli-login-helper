import { test, expect } from "bun:test";
import { formatInterval, resolveConfig } from "./index";

test("formatInterval: seconds", () => {
  expect(formatInterval(5000)).toBe("5s");
  expect(formatInterval(30000)).toBe("30s");
});

test("formatInterval: minutes", () => {
  expect(formatInterval(60000)).toBe("1.0m");
  expect(formatInterval(600000)).toBe("10.0m");
});

test("formatInterval: hours", () => {
  expect(formatInterval(3600000)).toBe("1.0h");
  expect(formatInterval(7200000)).toBe("2.0h");
});

test("resolveConfig: uses CLI opts over env", () => {
  const config = resolveConfig(
    { webhookUrl: "cli-url", identityProvider: "cli-idp" },
    { TEAMS_WEBHOOK_URL: "env-url", KIRO_IDENTITY_PROVIDER: "env-idp" }
  );
  expect(config.webhookUrl).toBe("cli-url");
  expect(config.identityProvider).toBe("cli-idp");
});

test("resolveConfig: falls back to env vars", () => {
  const config = resolveConfig(
    {},
    { TEAMS_WEBHOOK_URL: "env-url", KIRO_IDENTITY_PROVIDER: "env-idp", KIRO_LICENSE: "free", KIRO_REGION: "eu-west-1" }
  );
  expect(config.webhookUrl).toBe("env-url");
  expect(config.identityProvider).toBe("env-idp");
  expect(config.license).toBe("free");
  expect(config.region).toBe("eu-west-1");
});

test("resolveConfig: throws when webhookUrl missing", () => {
  expect(() => resolveConfig({}, {})).toThrow("Missing --webhook-url");
});

test("resolveConfig: throws when identityProvider missing", () => {
  expect(() => resolveConfig({ webhookUrl: "url" }, {})).toThrow("Missing --identity-provider");
});

test("resolveConfig: defaults license and region", () => {
  const config = resolveConfig({ webhookUrl: "url", identityProvider: "idp" }, {});
  expect(config.license).toBe("pro");
  expect(config.region).toBe("us-east-1");
});
