# kiro-cli-login-helper

Monitors `kiro-cli` login status and sends notifications to Microsoft Teams via webhook.

## Setup

```bash
bun install
cp .env.example .env
# Fill in TEAMS_WEBHOOK_URL and other values in .env
```

## Usage

```bash
# Check and login once
bun run src/index.ts

# Continuously monitor login status
bun run src/index.ts --watch

# Custom check interval (ms)
bun run src/index.ts --watch --interval 60000

# Show help
bun run src/index.ts --help
```

## Environment Variables

See `.env.example` for all available options.

## Tests

```bash
bun test
```
