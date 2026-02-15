const SETTINGS = {
  initialAgentCount: 42,
  minRadius: 7,
  maxRadius: 11,
  baseSpeed: 26,
  interactionCooldownMs: 2800,
  maxAgentLog: 100,
  maxRecentContacts: 100,
  maxGlobalFeed: 320,
  minConversationPairs: 2,
  maxConversationPairs: 6,
  turnDelayMinMs: 320,
  turnDelayMaxMs: 760,
};

const WORD_BANK = {
  firstNames: [
    "Rhea",
    "Malik",
    "Zara",
    "Jules",
    "Iris",
    "Quinn",
    "Arlo",
    "Nia",
    "Theo",
    "Sage",
    "Mina",
    "Dorian",
    "Anya",
    "Kian",
    "Nova",
    "Luca",
    "Talia",
    "Omar",
    "Priya",
    "Eli",
    "Cam",
    "Aya",
    "Noel",
    "Mara",
    "Bryn",
    "Soren",
    "Leah",
    "Rafi",
    "Yara",
    "Pax",
  ],
  lastNames: [
    "Vale",
    "Ng",
    "Stone",
    "Khan",
    "Morrow",
    "Dawes",
    "Arias",
    "Park",
    "Flores",
    "Sato",
    "Reyes",
    "Cole",
    "Ibrahim",
    "Bell",
    "Wilde",
    "Nash",
    "Mendes",
    "Singh",
    "Hart",
    "Adler",
    "Rowe",
    "Fox",
    "Lopez",
    "Chen",
    "Diaz",
    "Griffin",
    "Price",
    "Basu",
    "Quintero",
    "Shaw",
  ],
  roles: [
    "street cartographer",
    "signal repairer",
    "night market chef",
    "community mediator",
    "field botanist",
    "radio host",
    "bike courier",
    "tiny library keeper",
    "storm observer",
    "scrap inventor",
    "urban beekeeper",
    "itinerant teacher",
    "public muralist",
    "water systems tech",
    "story collector",
  ],
  traits: [
    "curious",
    "careful",
    "optimistic",
    "dry-witted",
    "earnest",
    "practical",
    "restless",
    "soft-spoken",
    "precise",
    "warm",
    "intense",
    "playful",
    "resilient",
    "methodical",
  ],
  quirks: [
    "writes notes on ticket stubs",
    "hums when focused",
    "collects lost keys",
    "keeps weather records",
    "sketches while listening",
    "names every tool",
    "brings tea to tense meetings",
    "quotes old songs out of context",
    "avoids elevators",
    "maps shortcuts from memory",
  ],
  goals: [
    "building trust between neighborhoods",
    "finding cleaner energy routes",
    "preserving overlooked stories",
    "improving public spaces",
    "teaching practical skills",
    "making daily life calmer",
    "helping people feel less alone",
    "designing more resilient systems",
    "tracking patterns others miss",
    "making the city easier to navigate",
  ],
  origins: [
    "grew up near freight lines and learned to read movement before words",
    "spent childhood afternoons fixing old radios with a grandparent",
    "moved often and became skilled at making friends quickly",
    "was raised above a busy market and learned every face by name",
    "learned patience from years of tending rooftop plants",
    "worked three jobs early and became excellent at prioritizing",
    "found confidence through neighborhood volunteer work",
  ],
  pivots: [
    "A flood years ago pushed them into public service.",
    "After a major blackout, they started organizing local response drills.",
    "A chance mentorship turned their side hobby into a calling.",
    "A difficult move across town taught them to build community on purpose.",
    "A long recovery period taught them to slow down and notice details.",
    "Losing an important notebook made them start sharing knowledge openly.",
  ],
  nowLines: [
    "Now they focus on steady progress and clear communication.",
    "Now they mentor younger neighbors while refining their craft.",
    "Now they split time between practical work and long walks for ideas.",
    "Now they keep a small circle but show up consistently for others.",
    "Now they measure success by whether people feel more capable after meeting them.",
  ],
  openers: [
    "Hey, quick thought",
    "Can I run an idea by you",
    "I keep noticing this pattern",
    "I might be overthinking this, but",
    "Small question for you",
  ],
  replies: [
    "That tracks with what I've seen",
    "I had the same instinct",
    "Good catch, honestly",
    "I can work with that",
    "That might actually solve two problems",
  ],
  verbs: [
    "mapped",
    "compared",
    "stress-tested",
    "reframed",
    "balanced",
    "untangled",
    "drafted",
    "challenged",
  ],
};

const canvas = document.getElementById("world-canvas");
const ctx = canvas.getContext("2d");

const ui = {
  toggleRun: document.getElementById("toggle-run"),
  regenWorld: document.getElementById("regen-world"),
  toggleAi: document.getElementById("toggle-ai"),
  applyCount: document.getElementById("apply-count"),
  speed: document.getElementById("speed"),
  agentCount: document.getElementById("agent-count"),
  statAgents: document.getElementById("stat-agents"),
  statInteractions: document.getElementById("stat-interactions"),
  statSpeed: document.getElementById("stat-speed"),
  statDialogue: document.getElementById("stat-dialogue"),
  statQueue: document.getElementById("stat-queue"),
  statRps: document.getElementById("stat-rps"),
  statTpm: document.getElementById("stat-tpm"),
  statTpd: document.getElementById("stat-tpd"),
  selectedAgent: document.getElementById("selected-agent"),
  globalFeed: document.getElementById("global-feed"),
  agentRoster: document.getElementById("agent-roster"),
};

const state = {
  agents: [],
  pairLastInteraction: new Map(),
  globalFeed: [],
  recentBursts: [],
  interactionCounter: 0,
  running: true,
  speedMultiplier: 1,
  selectedAgentId: null,
  world: { width: 900, height: 580 },
  lastTimestamp: 0,
  rosterDirty: true,
  selectedDirty: true,
  feedDirty: true,
  aiEnabledByServer: false,
  aiModeActive: false,
  aiProviderModel: "zai-glm-4.7",
  activeConversationPairs: new Set(),
  conversations: new Map(),
  conversationCounter: 0,
  turnQueue: [],
  turnInFlight: 0,
  turnConcurrency: 3,
  limitsPollTimer: null,
};

const palette = [
  "#d97f3f",
  "#2f7f74",
  "#cf5a57",
  "#4388b8",
  "#7a9150",
  "#c09035",
  "#8f6fbf",
  "#328a58",
  "#d16b7e",
  "#4b7a9e",
];

const dpr = window.devicePixelRatio || 1;
let worldBoundsEl = null;

init();

function init() {
  worldBoundsEl = canvas.parentElement;
  bindUi();
  resizeCanvas();
  createWorld(SETTINGS.initialAgentCount);
  animateReveal();
  loadAiConfig();
  startLimitsPolling();
  requestAnimationFrame(loop);
}

function bindUi() {
  ui.toggleAi.disabled = true;
  ui.toggleAi.title = "Set CEREBRAS_API_KEY in the backend to enable AI dialogue.";

  ui.speed.addEventListener("input", () => {
    state.speedMultiplier = Number(ui.speed.value);
    ui.statSpeed.textContent = `${state.speedMultiplier.toFixed(1)}x`;
  });

  ui.toggleRun.addEventListener("click", () => {
    state.running = !state.running;
    ui.toggleRun.textContent = state.running ? "Pause" : "Resume";
  });

  ui.regenWorld.addEventListener("click", () => {
    createWorld(state.agents.length);
  });

  ui.toggleAi.addEventListener("click", () => {
    if (!state.aiEnabledByServer) return;
    state.aiModeActive = !state.aiModeActive;
    if (!state.aiModeActive) {
      clearConversationState();
    }
    syncAiUi();
    processTurnQueue();
  });

  ui.applyCount.addEventListener("click", () => {
    const nextCount = clamp(Number(ui.agentCount.value) || SETTINGS.initialAgentCount, 8, 140);
    ui.agentCount.value = String(nextCount);
    createWorld(nextCount);
  });

  canvas.addEventListener("click", handleCanvasClick);
  window.addEventListener("resize", resizeCanvas);
}

function animateReveal() {
  const cards = Array.from(document.querySelectorAll(".reveal"));
  cards.forEach((card, idx) => {
    card.style.animationDelay = `${idx * 120}ms`;
  });
}

async function loadAiConfig() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error(`config_http_${response.status}`);
    const config = await response.json();

    state.aiEnabledByServer = Boolean(config.cerebrasEnabled);
    state.aiProviderModel = config.model || "zai-glm-4.7";
    state.aiModeActive = state.aiEnabledByServer;
    renderLimitStats(config.limits);
  } catch {
    state.aiEnabledByServer = false;
    state.aiModeActive = false;
  }

  syncAiUi();
}

function syncAiUi() {
  ui.toggleAi.disabled = !state.aiEnabledByServer;
  ui.toggleAi.textContent = state.aiModeActive ? "AI: On" : "AI: Off";
  ui.statDialogue.textContent = state.aiModeActive ? "Cerebras" : "Local";
  ui.toggleAi.title = state.aiEnabledByServer
    ? `Model: ${state.aiProviderModel}`
    : "Set CEREBRAS_API_KEY in the backend to enable AI dialogue.";
}

function startLimitsPolling() {
  if (state.limitsPollTimer) return;
  refreshLimits();
  state.limitsPollTimer = window.setInterval(refreshLimits, 1200);
}

async function refreshLimits() {
  try {
    const response = await fetch("/api/limits");
    if (!response.ok) return;
    const payload = await response.json();
    renderLimitStats(payload.limits, payload.usage, payload.queue);
  } catch {
    // Keep last known metrics on transient network errors.
  }
}

function renderLimitStats(limits = {}, usage = {}, queue = {}) {
  const rpsLimit = Number(limits.requestsPerSecond || limits.requests_per_second || 5);
  const tpmLimit = Number(limits.tokensPerMinute || limits.tokens_per_minute || 1_000_000);
  const tpdLimit = Number(limits.tokensPerDay || limits.tokens_per_day || 24_000_000);

  const rpsUsed = Number(usage.requestsLastSecond || 0);
  const tpmUsed = Number(usage.tokensLastMinute || 0);
  const tpdUsed = Number(usage.tokensLastDay || 0);
  const pending = Number(queue.pending || 0);
  const inFlight = Number(queue.inFlight || 0);

  ui.statRps.textContent = `${rpsUsed}/${rpsLimit}`;
  ui.statTpm.textContent = `${formatCompactNumber(tpmUsed)}/${formatCompactNumber(tpmLimit)}`;
  ui.statTpd.textContent = `${formatCompactNumber(tpdUsed)}/${formatCompactNumber(tpdLimit)}`;
  ui.statQueue.textContent = `${pending}+${inFlight}`;
}

function resizeCanvas() {
  const rect = worldBoundsEl.getBoundingClientRect();
  state.world.width = Math.max(360, rect.width);
  state.world.height = Math.max(320, rect.height);

  canvas.width = Math.floor(state.world.width * dpr);
  canvas.height = Math.floor(state.world.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createWorld(agentCount) {
  state.agents = [];
  state.pairLastInteraction.clear();
  state.globalFeed = [];
  state.recentBursts = [];
  state.interactionCounter = 0;
  state.selectedAgentId = null;
  clearConversationState();

  for (let i = 0; i < agentCount; i += 1) {
    state.agents.push(makeAgent(i + 1));
  }

  ui.statAgents.textContent = String(state.agents.length);
  ui.statInteractions.textContent = "0";
  state.rosterDirty = true;
  state.selectedDirty = true;
  state.feedDirty = true;
  renderRoster();
  renderSelectedAgent();
  renderFeed();
}

function makeAgent(id) {
  const persona = generatePersona(id);
  const radius = randFloat(SETTINGS.minRadius, SETTINGS.maxRadius);

  return {
    id,
    x: randFloat(radius, state.world.width - radius),
    y: randFloat(radius, state.world.height - radius),
    radius,
    heading: randFloat(0, Math.PI * 2),
    targetHeading: randFloat(0, Math.PI * 2),
    headingTimer: randFloat(0.6, 2.4),
    speedFactor: randFloat(0.72, 1.35),
    color: pick(palette),
    ...persona,
    interactionLog: [],
    recentContacts: [],
    interactionCount: 0,
  };
}

function generatePersona(seed) {
  const first = pick(WORD_BANK.firstNames);
  const last = pick(WORD_BANK.lastNames);
  const name = `${first} ${last}`;
  const role = pick(WORD_BANK.roles);
  const trait = pick(WORD_BANK.traits);
  const quirk = pick(WORD_BANK.quirks);
  const goal = pick(WORD_BANK.goals);

  const lifeStory = `${first} ${pick(WORD_BANK.origins)}. ${pick(WORD_BANK.pivots)} ${pick(
    WORD_BANK.nowLines
  )}`;

  return {
    seed,
    name,
    role,
    trait,
    quirk,
    goal,
    lifeStory,
  };
}

function loop(timestamp) {
  if (!state.lastTimestamp) {
    state.lastTimestamp = timestamp;
  }

  const deltaSeconds = Math.min((timestamp - state.lastTimestamp) / 1000, 0.05);
  state.lastTimestamp = timestamp;

  if (state.running) {
    update(deltaSeconds * state.speedMultiplier, timestamp);
  }

  render(timestamp);
  flushDirtyUi();
  requestAnimationFrame(loop);
}

function update(deltaSeconds, timestamp) {
  updateAgents(deltaSeconds);
  resolveCollisions(timestamp);
  pruneBursts(timestamp);
}

function updateAgents(deltaSeconds) {
  for (const agent of state.agents) {
    agent.headingTimer -= deltaSeconds;
    if (agent.headingTimer <= 0) {
      agent.targetHeading = randFloat(0, Math.PI * 2);
      agent.headingTimer = randFloat(0.9, 3.0);
    }

    const headingDiff = normalizeAngle(agent.targetHeading - agent.heading);
    agent.heading += headingDiff * Math.min(1, deltaSeconds * 1.8);

    const velocity = SETTINGS.baseSpeed * agent.speedFactor;
    agent.x += Math.cos(agent.heading) * velocity * deltaSeconds;
    agent.y += Math.sin(agent.heading) * velocity * deltaSeconds;

    if (agent.x <= agent.radius || agent.x >= state.world.width - agent.radius) {
      agent.heading = Math.PI - agent.heading;
      agent.x = clamp(agent.x, agent.radius, state.world.width - agent.radius);
    }

    if (agent.y <= agent.radius || agent.y >= state.world.height - agent.radius) {
      agent.heading = -agent.heading;
      agent.y = clamp(agent.y, agent.radius, state.world.height - agent.radius);
    }
  }
}

function resolveCollisions(timestamp) {
  for (let i = 0; i < state.agents.length; i += 1) {
    const a = state.agents[i];
    for (let j = i + 1; j < state.agents.length; j += 1) {
      const b = state.agents[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const minDistance = a.radius + b.radius;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq > minDistance * minDistance) {
        continue;
      }

      const distance = Math.max(0.001, Math.sqrt(distanceSq));
      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;

      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      const pairKey = makePairKey(a.id, b.id);
      if (state.activeConversationPairs.has(pairKey)) {
        continue;
      }

      const lastAt = state.pairLastInteraction.get(pairKey) || 0;
      if (timestamp - lastAt >= SETTINGS.interactionCooldownMs) {
        state.pairLastInteraction.set(pairKey, timestamp);
        if (state.aiModeActive && state.aiEnabledByServer) {
          startAiConversation(a, b, pairKey, timestamp);
        } else {
          registerLocalInteraction(a, b, timestamp);
        }
      }
    }
  }
}

function registerLocalInteraction(a, b, timestamp) {
  const convo = generateDialogue(a, b);
  registerInteractionEvent({
    a,
    b,
    timestamp,
    aLine: convo.aLine,
    bLine: convo.bLine,
    summary: convo.summary,
  });
}

function registerInteractionEvent({ a, b, timestamp, aLine, bLine, summary, conversationId = null }) {
  const when = new Date();

  const event = {
    id: ++state.interactionCounter,
    timestamp,
    displayTime: when.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    aId: a.id,
    bId: b.id,
    aName: a.name,
    bName: b.name,
    aLine,
    bLine,
    summary,
    conversationId,
  };

  state.globalFeed.unshift(event);
  if (state.globalFeed.length > SETTINGS.maxGlobalFeed) {
    state.globalFeed.pop();
  }

  pushAgentMemory(a, b, event);
  pushAgentMemory(b, a, event);

  state.recentBursts.push({
    aId: a.id,
    bId: b.id,
    expiresAt: timestamp + 900,
  });
  if (state.recentBursts.length > 120) {
    state.recentBursts.splice(0, state.recentBursts.length - 120);
  }

  ui.statInteractions.textContent = String(state.interactionCounter);
  state.rosterDirty = true;
  state.selectedDirty = true;
  state.feedDirty = true;
}

function pushAgentMemory(self, other, event) {
  self.interactionCount += 1;

  self.interactionLog.unshift({
    eventId: event.id,
    at: event.displayTime,
    withId: other.id,
    withName: other.name,
    summary: event.summary,
    myLine: self.id === event.aId ? event.aLine : event.bLine,
    theirLine: self.id === event.aId ? event.bLine : event.aLine,
  });
  if (self.interactionLog.length > SETTINGS.maxAgentLog) {
    self.interactionLog.length = SETTINGS.maxAgentLog;
  }

  const recentWithoutOther = self.recentContacts.filter((entry) => entry.withId !== other.id);
  recentWithoutOther.unshift({
    eventId: event.id,
    withId: other.id,
    withName: other.name,
    at: event.displayTime,
    lastSummary: event.summary,
  });
  self.recentContacts = recentWithoutOther.slice(0, SETTINGS.maxRecentContacts);
}

function startAiConversation(a, b, pairKey, timestamp) {
  const sessionId = ++state.conversationCounter;
  const openerId = Math.random() < 0.5 ? a.id : b.id;
  const maxPairs = randInt(SETTINGS.minConversationPairs, SETTINGS.maxConversationPairs);

  state.conversations.set(sessionId, {
    id: sessionId,
    pairKey,
    aId: a.id,
    bId: b.id,
    maxPairs,
    pairCount: 0,
    nextSpeakerId: openerId,
    pendingTurn: null,
    history: [],
    summary: `${a.name} and ${b.name} started a conversation.`,
    startedAt: timestamp,
  });
  state.activeConversationPairs.add(pairKey);

  enqueueConversationTurn(sessionId, false);
}

function enqueueConversationTurn(sessionId, allowEnd) {
  const session = state.conversations.get(sessionId);
  if (!session) return;

  state.turnQueue.push({
    sessionId,
    allowEnd,
    notBefore: performance.now() + randFloat(SETTINGS.turnDelayMinMs, SETTINGS.turnDelayMaxMs),
  });
  processTurnQueue();
}

function processTurnQueue() {
  if (!state.aiModeActive || !state.aiEnabledByServer) return;

  const now = performance.now();
  while (state.turnInFlight < state.turnConcurrency && state.turnQueue.length > 0) {
    const nextIndex = state.turnQueue.findIndex((job) => job.notBefore <= now);
    if (nextIndex < 0) {
      const soonest = Math.min(...state.turnQueue.map((job) => job.notBefore));
      const wait = Math.max(20, Math.floor(soonest - now));
      window.setTimeout(processTurnQueue, wait);
      return;
    }

    const [job] = state.turnQueue.splice(nextIndex, 1);
    runTurnJob(job);
  }
}

async function runTurnJob(job) {
  const session = state.conversations.get(job.sessionId);
  if (!session) return;

  const speaker = findAgentById(session.nextSpeakerId);
  const listener = findAgentById(getOtherParticipantId(session, session.nextSpeakerId));
  if (!speaker || !listener) {
    endConversation(session.id);
    return;
  }

  const payload = {
    speaker: serializeAgentForAi(speaker),
    listener: serializeAgentForAi(listener),
    history: session.history.slice(-10),
    turnIndex: session.history.length,
    maxTurns: session.maxPairs * 2,
    allowEnd: job.allowEnd,
  };

  state.turnInFlight += 1;
  try {
    const response = await fetch("/api/conversation-turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      applyTurnResult(session.id, speaker, listener, synthesizeLocalTurn(session, speaker, listener, job.allowEnd));
      return;
    }

    const data = await response.json();
    applyTurnResult(session.id, speaker, listener, data);
  } catch {
    applyTurnResult(session.id, speaker, listener, synthesizeLocalTurn(session, speaker, listener, job.allowEnd));
  } finally {
    state.turnInFlight -= 1;
    processTurnQueue();
  }
}

function applyTurnResult(sessionId, speaker, listener, data) {
  const session = state.conversations.get(sessionId);
  if (!session) return;

  const line = normalizeDialogLine(data?.line, speaker.name);
  const summary = normalizeSummary(data?.summary) || session.summary;
  const shouldEnd = Boolean(data?.shouldEnd);

  if (!line) {
    endConversation(session.id);
    return;
  }

  const turn = {
    speakerId: speaker.id,
    speakerName: speaker.name,
    line,
  };
  session.history.push(turn);
  session.summary = summary;

  if (!session.pendingTurn) {
    session.pendingTurn = turn;
    session.nextSpeakerId = listener.id;
    enqueueConversationTurn(session.id, true);
    return;
  }

  const firstTurn = session.pendingTurn;
  const secondTurn = turn;
  session.pendingTurn = null;
  session.pairCount += 1;

  const a = findAgentById(session.aId);
  const b = findAgentById(session.bId);
  if (!a || !b) {
    endConversation(session.id);
    return;
  }

  const aLine = firstTurn.speakerId === a.id ? firstTurn.line : secondTurn.line;
  const bLine = firstTurn.speakerId === b.id ? firstTurn.line : secondTurn.line;

  registerInteractionEvent({
    a,
    b,
    timestamp: state.lastTimestamp || performance.now(),
    aLine,
    bLine,
    summary: session.summary,
    conversationId: session.id,
  });

  state.pairLastInteraction.set(session.pairKey, state.lastTimestamp || performance.now());

  const reachedCap = session.pairCount >= session.maxPairs;
  if (shouldEnd || reachedCap || !state.aiModeActive) {
    endConversation(session.id);
    return;
  }

  session.nextSpeakerId = firstTurn.speakerId;
  enqueueConversationTurn(session.id, false);
}

function endConversation(sessionId) {
  const session = state.conversations.get(sessionId);
  if (!session) return;

  state.activeConversationPairs.delete(session.pairKey);
  state.conversations.delete(sessionId);
}

function getOtherParticipantId(session, speakerId) {
  return speakerId === session.aId ? session.bId : session.aId;
}

function synthesizeLocalTurn(session, speaker, listener, allowEnd) {
  const local = localTurnFromSeed(session, speaker, listener, allowEnd);
  return {
    line: local.line,
    shouldEnd: local.shouldEnd,
    summary: local.summary,
  };
}

function clearConversationState() {
  state.activeConversationPairs.clear();
  state.conversations.clear();
  state.turnQueue = [];
}

function serializeAgentForAi(agent) {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    trait: agent.trait,
    quirk: agent.quirk,
    goal: agent.goal,
    lifeStory: agent.lifeStory,
  };
}

function generateDialogue(a, b) {
  const topic = pick([a.goal, b.goal, "shared routines", "street logistics", "neighbor coordination"]);
  const opener = pick(WORD_BANK.openers);
  const reply = pick(WORD_BANK.replies);
  const verb = pick(WORD_BANK.verbs);

  const aLine = `${a.name.split(" ")[0]}: "${opener} - I'm focused on ${a.goal.toLowerCase()}."`;
  const bLine = `${b.name.split(" ")[0]}: "${reply}. My ${b.quirk.toLowerCase()} helps when ${topic.toLowerCase()} gets messy."`;
  const summary = `${a.name} and ${b.name} ${verb} ideas about ${topic.toLowerCase()}.`;

  return { aLine, bLine, summary };
}

function localTurnFromSeed(session, speaker, listener, allowEnd) {
  const idx = session.history.length;
  const speakerFirst = speaker.name.split(" ")[0];
  const listenerFirst = listener.name.split(" ")[0];
  const seedLines = [
    `${speakerFirst}: "I keep thinking about ${speaker.goal.toLowerCase()}."`,
    `${speakerFirst}: "That connects with your point, ${listenerFirst}."`,
    `${speakerFirst}: "Maybe we can run a small test this week."`,
    `${speakerFirst}: "Let's keep this practical and easy to follow."`,
  ];

  const shouldEnd = session.pairCount >= session.maxPairs - 1 || (allowEnd && idx >= 4 && Math.random() < 0.32);
  return {
    line: seedLines[idx % seedLines.length],
    shouldEnd,
    summary: `${speaker.name} and ${listener.name} are discussing workable next steps.`,
  };
}

function pruneBursts(timestamp) {
  state.recentBursts = state.recentBursts.filter((burst) => burst.expiresAt > timestamp);
}

function render(timestamp) {
  drawBackground(timestamp);
  drawBursts(timestamp);
  drawAgents();
}

function drawBackground(timestamp) {
  ctx.clearRect(0, 0, state.world.width, state.world.height);

  const gradient = ctx.createLinearGradient(0, 0, state.world.width, state.world.height);
  gradient.addColorStop(0, "#f7f0e2");
  gradient.addColorStop(1, "#d8ebe7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.world.width, state.world.height);

  const drift = (timestamp * 0.00002) % 42;
  ctx.strokeStyle = "rgba(23, 44, 53, 0.08)";
  ctx.lineWidth = 1;

  for (let x = -42 + drift; x < state.world.width; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 60, state.world.height);
    ctx.stroke();
  }
}

function drawBursts(timestamp) {
  for (const burst of state.recentBursts) {
    const a = findAgentById(burst.aId);
    const b = findAgentById(burst.bId);
    if (!a || !b) continue;

    const life = clamp((burst.expiresAt - timestamp) / 900, 0, 1);
    ctx.strokeStyle = `rgba(198, 93, 46, ${0.45 * life})`;
    ctx.lineWidth = 1.2 + life;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function drawAgents() {
  ctx.font = "11px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (const agent of state.agents) {
    const isSelected = agent.id === state.selectedAgentId;

    if (isSelected) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(198, 93, 46, 0.18)";
      ctx.arc(agent.x, agent.y, agent.radius + 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = agent.color;
    ctx.arc(agent.x, agent.y, agent.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = isSelected ? 2.2 : 1.1;
    ctx.strokeStyle = isSelected ? "#8c2f18" : "rgba(20, 39, 47, 0.7)";
    ctx.stroke();

    const shortName = agent.name.split(" ")[0];
    ctx.fillStyle = "rgba(15, 33, 38, 0.88)";
    ctx.fillText(shortName, agent.x, agent.y + agent.radius + 4);
  }
}

function flushDirtyUi() {
  if (state.rosterDirty) {
    renderRoster();
    state.rosterDirty = false;
  }

  if (state.selectedDirty) {
    renderSelectedAgent();
    state.selectedDirty = false;
  }

  if (state.feedDirty) {
    renderFeed();
    state.feedDirty = false;
  }
}

function renderRoster() {
  const rows = state.agents
    .slice()
    .sort((a, b) => b.interactionCount - a.interactionCount)
    .map((agent) => {
      const selectedClass = agent.id === state.selectedAgentId ? "selected" : "";
      return `<button class="roster-row ${selectedClass}" data-id="${agent.id}">
        <span class="dot" style="background:${agent.color};"></span>
        <span class="name">${escapeHtml(agent.name)}</span>
        <span class="role">${escapeHtml(agent.role)}</span>
        <span class="count">${agent.interactionCount}</span>
      </button>`;
    })
    .join("");

  ui.agentRoster.innerHTML = rows;
  ui.agentRoster.querySelectorAll(".roster-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      state.selectedAgentId = id;
      state.rosterDirty = true;
      state.selectedDirty = true;
    });
  });
}

function renderSelectedAgent() {
  const agent = findAgentById(state.selectedAgentId);
  if (!agent) {
    ui.selectedAgent.className = "selected-agent empty";
    ui.selectedAgent.innerHTML = "<p>No agent selected.</p>";
    return;
  }

  ui.selectedAgent.className = "selected-agent";
  ui.selectedAgent.innerHTML = `
    <div class="agent-header">
      <span class="chip" style="background:${agent.color};"></span>
      <div>
        <h3>${escapeHtml(agent.name)}</h3>
        <p>${escapeHtml(agent.role)}</p>
      </div>
    </div>
    <div class="agent-tags">
      <span>${escapeHtml(agent.trait)}</span>
      <span>${escapeHtml(agent.quirk)}</span>
      <span>${escapeHtml(agent.goal)}</span>
    </div>
    <p class="story">${escapeHtml(agent.lifeStory)}</p>
    <div class="memory-grid">
      <div>
        <h4>Recent Contacts (${agent.recentContacts.length}/100)</h4>
        <div class="memory-list">
          ${agent.recentContacts
            .slice(0, 100)
            .map(
              (entry) => `
              <article>
                <strong>${escapeHtml(entry.withName)}</strong>
                <p>${escapeHtml(entry.lastSummary)}</p>
              </article>
            `
            )
            .join("") || "<p>No contacts yet.</p>"}
        </div>
      </div>
      <div>
        <h4>Interaction Log (${agent.interactionLog.length}/100)</h4>
        <div class="memory-list">
          ${agent.interactionLog
            .slice(0, 100)
            .map(
              (entry) => `
              <article>
                <strong>${escapeHtml(entry.at)} with ${escapeHtml(entry.withName)}</strong>
                <p>${escapeHtml(entry.myLine)}</p>
                <p>${escapeHtml(entry.theirLine)}</p>
              </article>
            `
            )
            .join("") || "<p>No interactions logged yet.</p>"}
        </div>
      </div>
    </div>
  `;
}

function renderFeed() {
  const items = state.globalFeed
    .slice(0, 120)
    .map(
      (entry) => `
      <article class="feed-item">
        <header>
          <strong>#${entry.id}</strong>
          <span>${escapeHtml(entry.displayTime)}</span>
        </header>
        <p>${escapeHtml(entry.aLine)}</p>
        <p>${escapeHtml(entry.bLine)}</p>
        <footer>${escapeHtml(entry.summary)}</footer>
      </article>
    `
    )
    .join("");

  ui.globalFeed.innerHTML = items || "<p class='empty-feed'>No interactions yet.</p>";
}

function handleCanvasClick(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  let nearest = null;
  let nearestDist = Number.POSITIVE_INFINITY;

  for (const agent of state.agents) {
    const dx = agent.x - x;
    const dy = agent.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = agent;
    }
  }

  if (nearest && nearestDist <= nearest.radius + 14) {
    state.selectedAgentId = nearest.id;
  } else {
    state.selectedAgentId = null;
  }

  state.rosterDirty = true;
  state.selectedDirty = true;
}

function findAgentById(id) {
  if (!id) return null;
  return state.agents.find((agent) => agent.id === id) || null;
}

function makePairKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randInt(min, max) {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function randFloat(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function normalizeDialogLine(value, speakerName) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;
  const startsWithName = cleaned.toLowerCase().startsWith(`${speakerName.split(" ")[0].toLowerCase()}:`);
  return startsWithName ? cleaned : `${speakerName.split(" ")[0]}: "${cleaned}"`;
}

function normalizeSummary(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned || null;
}

function formatCompactNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
