# agent-space

Web app sandbox where autonomous agents wander a 2D world, collide, and hold generated conversations.

## Features

- Overhead simulation with randomly moving agents
- Generated persona + mini life story for each agent
- Turn-based conversations where agents alternate replies
- Conversation queueing on both client and server
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

3. Set `CEREBRAS_API_KEY` in `.env` (gitignored).

4. Start:

```powershell
npm start
```

5. Open `http://localhost:8080`

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

`server.js` enforces these via a global dispatch queue and rolling windows.
