export interface LoginConfig {
  license: string;
  identityProvider: string;
  region: string;
}

export async function checkLogin(): Promise<boolean> {
  const proc = Bun.spawn(["kiro-cli", "whoami"], { stdout: "pipe", stderr: "pipe" });
  await proc.exited;
  return proc.exitCode === 0;
}

export class LoginSession {
  private deviceUrl: string | null = null;
  private notificationSent = false;

  async start(config: LoginConfig, onDeviceUrl: (url: string) => void): Promise<void> {
    let entersSent = 0;

    const proc = Bun.spawn(
      ["kiro-cli", "login", "--license", config.license,
        "--identity-provider", config.identityProvider,
        "--region", config.region,
        "--use-device-flow"],
      {
        terminal: {
          cols: 120,
          rows: 30,
          data: (terminal, data) => {
            process.stdout.write(data);
            const str = data.toString();

            if (entersSent === 0 && str.includes("Enter Start URL")) {
              terminal.write("\r");
              entersSent++;
            } else if (entersSent === 1 && str.includes("Enter Region")) {
              terminal.write("\r");
              entersSent++;
            }

            if (!this.notificationSent) {
              const match = str.match(/https:\/\/\S+device\?user_code=([A-Z0-9-]+)/);
              if (match) {
                this.deviceUrl = match[0];
                this.notificationSent = true;
                onDeviceUrl(match[0]);
              }
            }
          },
        },
      }
    );

    await proc.exited;
    proc.terminal.close();
  }
}

export async function getWhoami(): Promise<string> {
  return await new Response(Bun.spawn(["kiro-cli", "whoami"], { stdout: "pipe" }).stdout).text();
}

export function extractCodeFromUrl(url: string): string | null {
  const match = url.match(/user_code=([A-Z0-9-]+)/);
  return match?.[1] ?? null;
}
