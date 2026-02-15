# agent-space

Web app sandbox where autonomous agents wander a 2D space, collide, and have generated conversations.

## Features

- Overhead world simulation with randomly moving agents
- Generated persona and mini life story per agent
- Collision-driven interactions and live global feed
- Per-agent history:
  - last 100 interaction log entries
  - last 100 recent contacts
- Click any agent to inspect profile and memory

## Run

Serve the folder with any static server, then open the URL in your browser.

PowerShell examples:

```powershell
# Python 3
python -m http.server 8080

# Node (if installed)
npx serve .
```

Then visit:

- `http://localhost:8080` (python)
- `http://localhost:3000` or printed URL (`npx serve`)

