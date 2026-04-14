import cac from "cac";
import { consola } from "consola";
import { appendFileSync } from "fs";
import { checkLogin } from "./kiro";
import { createCheckAndLogin, handleLogin } from "./monitor";

export function formatInterval(ms: number): string {
  const s = ms / 1000;
  return s >= 3600 ? `${(s / 3600).toFixed(1)}h` : s >= 60 ? `${(s / 60).toFixed(1)}m` : `${s}s`;
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
  .option("--interval <ms>", "Check interval in ms (requires --watch)", { default: Number(process.env.CHECK_INTERVAL_MS ?? 5000) })
  .option("--log-file <path>", "Append logs to file")
  .option("--webhook-url <url>", "Teams webhook URL")
  .option("--license <type>", "Kiro license type", { default: process.env.KIRO_LICENSE ?? "pro" })
  .option("--identity-provider <url>", "Kiro identity provider URL")
  .option("--region <region>", "Kiro region", { default: process.env.KIRO_REGION ?? "us-east-1" })
  .action(({ watch, interval, logFile, webhookUrl, license, identityProvider, region }) => {
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

    const checkAndLogin = createCheckAndLogin(checkLogin, handleLogin);
    if (watch) {
      checkAndLogin();
      setInterval(() => checkAndLogin(), interval);
      consola.info(`Monitoring kiro-cli login status every ${formatInterval(interval)}`);
    } else {
      checkAndLogin();
    }
  });

cli.help();
cli.parse();
