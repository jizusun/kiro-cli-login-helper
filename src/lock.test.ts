import { test, expect, beforeEach } from "bun:test";
import { acquireLock, releaseLock } from "./lock";

beforeEach(() => releaseLock());

test("acquireLock succeeds on first call", () => {
  expect(acquireLock()).toBe(true);
});

test("acquireLock fails when already held by this process", () => {
  acquireLock();
  expect(acquireLock()).toBe(false);
});

test("releaseLock allows re-acquire", () => {
  acquireLock();
  releaseLock();
  expect(acquireLock()).toBe(true);
});

test("acquireLock succeeds when held by dead process", () => {
  // Write a lock with a non-existent PID
  const { writeFileSync } = require("fs");
  writeFileSync("/tmp/kiro-login.lock", JSON.stringify({ pid: 999999999, time: Date.now() }));
  expect(acquireLock()).toBe(true);
});

test("acquireLock succeeds when lock is stale", () => {
  const { writeFileSync } = require("fs");
  writeFileSync("/tmp/kiro-login.lock", JSON.stringify({ pid: process.pid, time: Date.now() - 6 * 60 * 1000 }));
  expect(acquireLock()).toBe(true);
});
