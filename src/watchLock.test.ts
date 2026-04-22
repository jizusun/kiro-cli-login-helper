import { test, expect, beforeEach } from "bun:test";
import { acquireWatchLock, releaseWatchLock } from "./watchLock";
import { writeFileSync } from "fs";

const WATCH_LOCK_FILE = "/tmp/kiro-login-watch.lock";

beforeEach(() => releaseWatchLock());

test("acquireWatchLock succeeds on first call", () => {
  expect(acquireWatchLock()).toBe(true);
});

test("acquireWatchLock fails when already held by this process", () => {
  acquireWatchLock();
  expect(acquireWatchLock()).toBe(false);
});

test("releaseWatchLock allows re-acquire", () => {
  acquireWatchLock();
  releaseWatchLock();
  expect(acquireWatchLock()).toBe(true);
});

test("acquireWatchLock succeeds when held by dead process", () => {
  writeFileSync(WATCH_LOCK_FILE, JSON.stringify({ pid: 999999999 }));
  expect(acquireWatchLock()).toBe(true);
});
