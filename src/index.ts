import cac from "cac";
import { consola } from "consola";
import { appendFileSync } from "fs";
import { checkLogin } from "./kiro";
import { checkAndLogin, handleLogin } from "./monitor";

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

    const url = webhookUrl ?? process.env.TEAMS_WEBHOOK_URL;
    if (!url) {
      consola.error("Missing --webhook-url or TEAMS_WEBHOOK_URL env var");
      process.exit(1);
    }
    process.env.TEAMS_WEBHOOK_URL = url;
    process.env.KIRO_LICENSE = license;

    const idp = identityProvider ?? process.env.KIRO_IDENTITY_PROVIDER;
    if (!idp) {
      consola.error("Missing --identity-provider or KIRO_IDENTITY_PROVIDER env var");
      process.exit(1);
    }
    process.env.KIRO_IDENTITY_PROVIDER = idp;
    process.env.KIRO_REGION = region;

    const isLoggingIn = { value: false };
    if (watch) {
      setInterval(() => checkAndLogin(isLoggingIn, checkLogin, handleLogin), interval);
      const seconds = interval / 1000;
      const humanTime = seconds >= 3600 ? `${(seconds / 3600).toFixed(1)}h` : seconds >= 60 ? `${(seconds / 60).toFixed(1)}m` : `${seconds}s`;
      consola.info(`Monitoring kiro-cli login status every ${humanTime}`);
    } else {
      checkAndLogin(isLoggingIn, checkLogin, handleLogin);
    }
  });

cli.help();
cli.parse();
