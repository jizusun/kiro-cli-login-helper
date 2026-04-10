import { test, expect } from "bun:test";
import { hostFacts } from "./system";

test("hostFacts returns array with 5 facts", () => {
  const facts = hostFacts();
  expect(facts.length).toBe(5);
});

test("hostFacts contains required fields", () => {
  const facts = hostFacts();
  const titles = facts.map(f => f.title);
  
  expect(titles).toContain("Host");
  expect(titles).toContain("User");
  expect(titles).toContain("Platform");
  expect(titles).toContain("IP");
  expect(titles).toContain("Time");
});
