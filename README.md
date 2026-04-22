# kiro-cli-login-helper

Monitors `kiro-cli` login status and sends notifications to Microsoft Teams via webhook.

## Modes

- **On-demand** — runs once: checks login status, triggers login if needed, then exits.
- **Watch** — runs continuously: checks every interval, triggers login when needed, sends Teams cards with approval links. Only one watch process can run at a time.

## Setup

```bash
bun install
cp .env.example .env
# Fill in TEAMS_WEBHOOK_URL and other values in .env
```

## Usage

```bash
# On-demand: check and login once
bun start

# Watch: continuously monitor login status
bun start --watch

# Custom check interval (ms)
bun start --watch --interval 30000

# Custom device code expiry (ms)
bun start --watch --device-code-expires 300000

# Write timestamped logs to a file
bun start --watch --log-file logs/app.log

# Show help
bun start --help
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TEAMS_WEBHOOK_URL` | *(required)* | Microsoft Teams webhook URL |
| `CHECK_INTERVAL_MS` | `60000` (1 min) | How often to check login status in watch mode |
| `DEVICE_CODE_EXPIRES_MS` | `600000` (10 min) | Device code expiry. Login is killed 1 min before this to allow a fresh code |
| `LOG_FILE` | — | Path to append timestamped logs |
| `KIRO_LICENSE` | `pro` | Kiro license type |
| `KIRO_IDENTITY_PROVIDER` | — | Identity provider URL (required) |
| `KIRO_REGION` | `us-east-1` | AWS region |

## systemd Service

The service unit is at `~/.config/systemd/user/kiro-cli-login-watch.service`.

**Important:** The `ExecStart` must include `--watch` so the service monitors continuously (without it, the process runs once and exits). Use `--log-file` for timestamped logs.

```ini
ExecStart=...bun run src/index.ts --watch --log-file /path/to/logs/app.log
```

Common commands:

```bash
# View service status
systemctl --user status kiro-cli-login-watch

# Restart after config changes
systemctl --user daemon-reload && systemctl --user restart kiro-cli-login-watch

# Tail timestamped logs
tail -f logs/app.log

# View journal logs (with timestamps)
journalctl --user -u kiro-cli-login-watch -f
```

## Tests

```bash
bun test
```
