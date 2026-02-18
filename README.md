# agent-space

Web app sandbox where autonomous agents wander a 2D world, collide, and hold generated conversations.

## Features

- Overhead simulation with randomly moving agents
- Generated persona + mini life story for each agent
- Turn-based conversations where agents alternate replies
- Conversation queueing on both client and server
- One-screen dashboard layout with pagination for long lists
- `Open Conversation Lab` button for simple two-bot testing with global runtime settings
- `Open Web-LLM Tab` button for in-browser local model testing in a separate tab
- `Open API Trace` button to inspect exact Cerebras request/response payloads
- Global Cerebras limit tracking:
  - requests per second
  - tokens per minute
  - tokens per day
- Per-agent memory:
  - last 100 interaction log entries
  - last 100 recent contacts

## Run

1. Install dependencies:

```powershell
npm install
```

2. Create env file:

```powershell
Copy-Item .env.example .env
```

3. Optional: set `CEREBRAS_API_KEY` in `.env` (gitignored).
4. You can also paste a key in the `API Key` field in the app UI (it sends `x-cerebras-api-key` per request).

5. Start:

```powershell
npm start
```

6. Open `http://localhost:8080`

## Cerebras Model Settings

- `model=zai-glm-4.7`
- `temperature=1`
- `top_p=0.95`
- `disable_reasoning=false`
- `clear_thinking=false`

## Rate Limit Settings

Configured in `.env`:

- `CEREBRAS_LIMIT_RPS=5`
- `CEREBRAS_LIMIT_TPM=1000000`
- `CEREBRAS_LIMIT_TPD=24000000`
- `CEREBRAS_LIMIT_CONCURRENCY=5`
- `CEREBRAS_DEBUG_LOGS_ENABLED=true`
- `CEREBRAS_DEBUG_LOGS_MAX=300`

`server.js` enforces these via a global dispatch queue and rolling windows.

## Conversation Lab

Use `Open Conversation Lab` from the main app to:

- run simple two-bot turn testing
- edit runtime model settings (`model`, `temperature`, `top_p`, token caps, reasoning flags)
- edit generation constraints (`line/summary max chars`, `turn min chars`, markdown/stage-direction/alternate-turn flags)
- edit prompt templates used by interaction/turn/lab routes

Runtime changes are applied globally to the server and affect all bot requests until server restart.
