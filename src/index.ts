import cac from "cac";
import { consola } from "consola";
import { appendFileSync } from "fs";
import { checkLogin } from "./kiro";
import { createCheckAndLogin, handleLogin } from "./login";
import { acquireWatchLock, releaseWatchLock } from "./watchLock";

const savedTty = process.stdin.isTTY
  ? Bun.spawnSync(["stty", "-g"], { stdin: "inherit" }).stdout.toString().trim()
  : null;

function restoreTerminal() {
  if (savedTty) try { Bun.spawnSync(["stty", savedTty], { stdin: "inherit" }); } catch {}
}
process.on("SIGINT", () => { restoreTerminal(); process.exit(130); });
process.on("SIGTERM", () => { restoreTerminal(); process.exit(143); });

export function formatInterval(ms: number): string {
  const s = ms / 1000;
  if (s >= 3600) { const v = s / 3600; return `${v % 1 ? v.toFixed(1) : v} hr`; }
  if (s >= 60) { const v = s / 60; return `${v % 1 ? v.toFixed(1) : v} min`; }
  return `${s % 1 ? s.toFixed(1) : s} sec`;
}

export interface CliOptions {
  webhookUrl?: string;
  identityProvider?: string;
  license?: string;
  region?: string;
}

export interface ResolvedConfig {
  webhookUrl: string;
  identityProvider: string;
  license: string;
  region: string;
}

export function resolveConfig(opts: CliOptions, env: Record<string, string | undefined>): ResolvedConfig {
  const webhookUrl = opts.webhookUrl ?? env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("Missing --webhook-url or TEAMS_WEBHOOK_URL env var");

  const identityProvider = opts.identityProvider ?? env.KIRO_IDENTITY_PROVIDER;
  if (!identityProvider) throw new Error("Missing --identity-provider or KIRO_IDENTITY_PROVIDER env var");

  return {
    webhookUrl,
    identityProvider,
    license: opts.license ?? env.KIRO_LICENSE ?? "pro",
    region: opts.region ?? env.KIRO_REGION ?? "us-east-1",
  };
}

const cli = cac("kiro-login-helper");

cli
  .command("", "Check kiro-cli login status and notify Teams")
  .option("--watch", "Continuously monitor login status")
  .option("--interval <ms>", "Check interval in ms (requires --watch)", { default: Number(process.env.CHECK_INTERVAL_MS ?? 60000) })
  .option("--device-code-expires <ms>", "Device code expiry in ms", { default: Number(process.env.DEVICE_CODE_EXPIRES_MS ?? 600000) })
  .option("--log-file <path>", "Append logs to file")
  .option("--webhook-url <url>", "Teams webhook URL")
  .option("--license <type>", "Kiro license type", { default: process.env.KIRO_LICENSE ?? "pro" })
  .option("--identity-provider <url>", "Kiro identity provider URL")
  .option("--region <region>", "Kiro region", { default: process.env.KIRO_REGION ?? "us-east-1" })
  .action(({ watch, interval, deviceCodeExpires, logFile, webhookUrl, license, identityProvider, region }) => {
    const file = logFile ?? process.env.LOG_FILE;
    if (file) {
      consola.addReporter({ log: (logObj) => {
        appendFileSync(file, `[${new Date().toISOString()}] ${logObj.args.join(" ")}\n`);
      }});
    }

    let config: ResolvedConfig;
    try {
      config = resolveConfig({ webhookUrl, identityProvider, license, region }, process.env);
    } catch (e: any) {
      consola.error(e.message);
      process.exit(1);
    }

    process.env.TEAMS_WEBHOOK_URL = config.webhookUrl;
    process.env.KIRO_IDENTITY_PROVIDER = config.identityProvider;
    process.env.KIRO_LICENSE = config.license;
    process.env.KIRO_REGION = config.region;

    const checkAndLogin = createCheckAndLogin(checkLogin, handleLogin, watch, interval, deviceCodeExpires);
    if (watch) {
      if (!acquireWatchLock()) {
        consola.error("Another --watch process is already running");
        process.exit(1);
      }
      process.on("exit", releaseWatchLock);
      checkAndLogin();
      setInterval(() => checkAndLogin(), interval);
      consola.info(`Monitoring kiro-cli login status every ${formatInterval(interval)}, code expires in ${formatInterval(deviceCodeExpires)}`);
    } else {
      checkAndLogin();
    }
  });

cli.help();
cli.parse();
