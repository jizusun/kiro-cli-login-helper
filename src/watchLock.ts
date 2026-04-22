import { mkdirSync, unlinkSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";

const WATCH_LOCK_FILE = "/tmp/kiro-login-watch.lock";

export function acquireWatchLock(): boolean {
  try {
    const { pid } = JSON.parse(readFileSync(WATCH_LOCK_FILE, "utf-8"));
    if (isProcessAlive(pid)) return false;
  } catch {}

  mkdirSync(dirname(WATCH_LOCK_FILE), { recursive: true });
  writeFileSync(WATCH_LOCK_FILE, JSON.stringify({ pid: process.pid }));
  return true;
}

export function releaseWatchLock() {
  try { unlinkSync(WATCH_LOCK_FILE); } catch {}
}

function isProcessAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true; } catch { return false; }
}
