import { test, expect } from "bun:test";
import { extractCodeFromUrl } from "./kiro";

test("extractCodeFromUrl extracts code from valid URL", () => {
  const url = "https://hsdp-poc.awsapps.com/start/#/device?user_code=GRZQ-PQPP";
  expect(extractCodeFromUrl(url)).toBe("GRZQ-PQPP");
});

test("extractCodeFromUrl returns null for invalid URL", () => {
  expect(extractCodeFromUrl("https://example.com")).toBe(null);
});
