import { mkdirSync, unlinkSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";

const LOCK_FILE = "/tmp/kiro-login.lock";
const STALE_MS = 5 * 60 * 1000; // 5 minutes

export function acquireLock(): boolean {
  try {
    const content = readFileSync(LOCK_FILE, "utf-8");
    const { pid, time } = JSON.parse(content);
    const alive = isProcessAlive(pid);
    const stale = Date.now() - time > STALE_MS;
    if (alive && !stale) return false;
  } catch {}

  mkdirSync(dirname(LOCK_FILE), { recursive: true });
  writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, time: Date.now() }));
  return true;
}

export function releaseLock() {
  try { unlinkSync(LOCK_FILE); } catch {}
}

function isProcessAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true; } catch { return false; }
}
