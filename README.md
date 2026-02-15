# agent-space

Web app sandbox where autonomous agents wander a 2D space, collide, and have generated conversations.

## Features

- Overhead world simulation with randomly moving agents
- Generated persona and mini life story per agent
- Collision-driven interactions and live global feed
- Optional Cerebras-powered dialogue generation via backend proxy
- Per-agent history:
  - last 100 interaction log entries
  - last 100 recent contacts
- Click any agent to inspect profile and memory

## Run

1. Install dependencies:

```powershell
npm install
```

2. Create your local env file:

```powershell
Copy-Item .env.example .env
```

3. Set `CEREBRAS_API_KEY` in `.env` (already gitignored).

4. Start the app:

```powershell
npm start
```

5. Open:

- `http://localhost:8080`

## Cerebras defaults used

- `model=zai-glm-4.7`
- `temperature=1`
- `top_p=0.95`
- `clear_thinking=false` (preserve traces)
- `disable_reasoning=false` (reasoning enabled)
- `max_completion_tokens=1200` (adjust up to your workload needs)

## Notes

- API key is kept server-side in `server.js` via environment variables and is never sent to the browser.
- If Cerebras is unavailable or returns invalid output, dialogue automatically falls back to local generation.
```

Then visit:

- `http://localhost:8080` (python)
- `http://localhost:3000` or printed URL (`npx serve`)

