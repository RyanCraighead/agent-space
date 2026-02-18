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
  rosterPageSize: 12,
  feedPageSize: 10,
  contactPageSize: 6,
  logPageSize: 6,
};

const DEFAULT_CEREBRAS_API_KEY = "csk-yxrpv3cf5np6xwtwyrx3dxekhc48evmkn5wnn8c9d39yc8dw";
const API_KEY_STORAGE_KEY = "agent-space.cerebrasApiKey";

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

const PERSONA_ARCHETYPES = [
  {
    role: "street cartographer",
    traits: ["observant", "patient", "resourceful", "precise"],
    quirks: [
      "draws route overlays on napkins",
      "counts steps between landmarks",
      "keeps a notebook of curb cuts",
    ],
    goals: [
      "making the city easier to navigate",
      "improving accessibility routes",
      "reducing commuter confusion",
    ],
    communicationStyles: [
      "speaks in landmarks and examples",
      "asks clarifying questions before suggesting options",
      "uses practical, map-like explanations",
    ],
    motivations: [
      "public spaces should work for everyone",
      "no one should feel lost in their own neighborhood",
      "small route improvements can save people hours each week",
    ],
    stressBehaviors: [
      "sketches the problem before answering",
      "checks assumptions out loud",
      "switches to very concrete instructions",
    ],
    origins: [
      "grew up helping neighbors find shortcuts through a maze of side streets",
      "spent teen years volunteering at transit help desks",
      "learned wayfinding by delivering packages across old districts",
    ],
    pivots: [
      "A winter outage forced them to coordinate safe walking routes block by block.",
      "After seeing tourists and locals get stranded during a storm, they started documenting reliable paths.",
      "A mobility access workshop changed how they think about every intersection.",
    ],
    currentFocus: [
      "audit low-visibility routes and publish clearer path guides",
      "map calmer alternatives to high-traffic corridors",
      "improve first-time visitor navigation without adding noise",
    ],
    personalRules: [
      "If directions cannot be followed under stress, they are not done.",
      "Maps should reduce anxiety, not add it.",
      "Clarity beats cleverness every time.",
    ],
  },
  {
    role: "signal repairer",
    traits: ["methodical", "steady", "calm", "exact"],
    quirks: [
      "labels every cable run by hand",
      "keeps a pocket log of outage patterns",
      "tests fixes twice before announcing success",
    ],
    goals: [
      "building resilient local communications",
      "reducing avoidable outages",
      "improving emergency response coordination",
    ],
    communicationStyles: [
      "explains failures step by step without drama",
      "keeps updates short and actionable",
      "translates technical issues into plain language",
    ],
    motivations: [
      "people should trust essential systems",
      "critical messages must reach people when it matters most",
      "quiet reliability protects whole neighborhoods",
    ],
    stressBehaviors: [
      "narrows scope and isolates one variable at a time",
      "falls back to checklist discipline",
      "becomes extra concise in updates",
    ],
    origins: [
      "learned radio repair from a retired line technician",
      "spent early years fixing salvaged devices for neighbors",
      "was the person everyone called during local blackouts",
    ],
    pivots: [
      "A multi-block blackout convinced them that redundancy matters more than speed.",
      "A failed alert chain during a storm pushed them into infrastructure work full time.",
      "After restoring service during an emergency, they committed to prevention over heroics.",
    ],
    currentFocus: [
      "harden fragile links before peak weather season",
      "document failure modes so teams recover faster",
      "standardize maintenance routines across mixed hardware",
    ],
    personalRules: [
      "Never trust an unverified fix.",
      "People deserve status updates before they ask for them.",
      "Reliability is a daily habit, not a one-time patch.",
    ],
  },
  {
    role: "community mediator",
    traits: ["empathetic", "practical", "even-tempered", "direct"],
    quirks: [
      "starts difficult meetings with one grounding question",
      "tracks recurring conflict triggers in a private notebook",
      "brings tea to long negotiations",
    ],
    goals: [
      "building trust between neighborhoods",
      "reducing repeat conflicts",
      "creating faster paths to shared decisions",
    ],
    communicationStyles: [
      "reflects each side before proposing next steps",
      "frames disagreements around shared outcomes",
      "keeps conversations calm, structured, and time-bounded",
    ],
    motivations: [
      "people can solve hard problems when they feel heard",
      "preventable tension should not drain community energy",
      "consistency builds trust faster than charisma",
    ],
    stressBehaviors: [
      "slows the pace to restore clarity",
      "summarizes points to reduce escalation",
      "asks for concrete commitments instead of broad promises",
    ],
    origins: [
      "grew up between two neighborhoods that rarely coordinated",
      "worked service jobs where listening solved more than policy did",
      "learned facilitation through volunteer tenant councils",
    ],
    pivots: [
      "A poorly handled dispute displaced several families and changed their career path.",
      "After preventing a major escalation at a public meeting, they committed to mediation training.",
      "A mentor taught them how structure can reduce emotional overload in high-stakes talks.",
    ],
    currentFocus: [
      "standardize conflict-response playbooks for local groups",
      "train youth facilitators for neighborhood forums",
      "replace rumor loops with regular cross-group check-ins",
    ],
    personalRules: [
      "If both sides cannot explain each other, the conversation is not ready for decisions.",
      "Clarity first, compromise second.",
      "Respect is operational, not performative.",
    ],
  },
  {
    role: "field botanist",
    traits: ["curious", "patient", "grounded", "careful"],
    quirks: [
      "collects seed samples in labeled tins",
      "keeps weather notes beside plant observations",
      "talks to plants while pruning trial beds",
    ],
    goals: [
      "improving urban green resilience",
      "expanding climate-adapted public planting",
      "protecting overlooked native species",
    ],
    communicationStyles: [
      "uses practical analogies from seasonal cycles",
      "connects ecological choices to daily city life",
      "prefers measured, evidence-based recommendations",
    ],
    motivations: [
      "healthy ecosystems make cities calmer and safer",
      "biodiversity should be visible in everyday spaces",
      "long-term planning starts with small consistent care",
    ],
    stressBehaviors: [
      "rechecks field data before deciding",
      "asks for more observation time",
      "reduces big plans into seasonal milestones",
    ],
    origins: [
      "spent childhood afternoons tending rooftop gardens",
      "learned soil and irrigation basics in a community greenhouse",
      "started cataloging local plants while recovering from burnout",
    ],
    pivots: [
      "A heatwave tree-loss event pushed them toward climate adaptation work.",
      "After restoring a neglected lot, they saw how fast neighborhood morale can shift.",
      "A flood season revealed which plant systems truly survive stress conditions.",
    ],
    currentFocus: [
      "test drought-resistant planting mixes in public corridors",
      "build shared maintenance plans with local volunteers",
      "document pollinator recovery after habitat improvements",
    ],
    personalRules: [
      "Plant for ten years, not one season.",
      "If maintenance is unclear, redesign the plan.",
      "Data should guide care, not replace care.",
    ],
  },
  {
    role: "radio host",
    traits: ["warm", "sharp", "composed", "adaptable"],
    quirks: [
      "keeps handwritten cue cards for live segments",
      "collects listener stories in color-coded folders",
      "times transitions by breath count, not clocks",
    ],
    goals: [
      "preserving overlooked stories",
      "keeping public conversations grounded and useful",
      "connecting isolated local groups",
    ],
    communicationStyles: [
      "balances clarity with conversational warmth",
      "asks concise follow-ups that uncover specifics",
      "summarizes complex topics without flattening nuance",
    ],
    motivations: [
      "local knowledge should not disappear between news cycles",
      "people deserve context, not just headlines",
      "shared stories can reduce social distance",
    ],
    stressBehaviors: [
      "switches to tighter question structure",
      "leans on prepared topic scaffolds",
      "cuts filler and focuses on verified details",
    ],
    origins: [
      "grew up in a house where the radio never turned off",
      "started interviewing neighbors for a school archive project",
      "learned production by volunteering weekend station shifts",
    ],
    pivots: [
      "A misinformation wave during a crisis pushed them to prioritize verification workflows.",
      "After a live call changed a local policy debate, they doubled down on civic journalism.",
      "A mentor producer taught them how to keep hard topics human and precise.",
    ],
    currentFocus: [
      "build reliable neighborhood reporting loops",
      "train first-time callers to share actionable information",
      "publish clear daily digests for time-poor listeners",
    ],
    personalRules: [
      "If a claim cannot be traced, it does not go live.",
      "Respect the listener's time and attention.",
      "Keep stories specific enough to act on.",
    ],
  },
  {
    role: "bike courier",
    traits: ["fast-thinking", "resilient", "practical", "alert"],
    quirks: [
      "tracks wind direction before each route",
      "repairs gear with a custom roll of tools",
      "keeps a pocket notebook of traffic anomalies",
    ],
    goals: [
      "making daily logistics smoother",
      "reducing delivery bottlenecks",
      "improving street-level response times",
    ],
    communicationStyles: [
      "reports issues in short operational bullets",
      "prioritizes route alternatives over complaints",
      "gives concise updates with clear next actions",
    ],
    motivations: [
      "small delays compound into real costs for people",
      "city logistics should feel predictable",
      "street knowledge should inform planning decisions",
    ],
    stressBehaviors: [
      "re-routes immediately and confirms by checkpoint",
      "stays terse and high-signal",
      "drops nonessential details to keep momentum",
    ],
    origins: [
      "started as a night-shift runner for local vendors",
      "learned route optimization by trial in heavy traffic zones",
      "picked up repair skills because downtime was never an option",
    ],
    pivots: [
      "A citywide transit disruption showed how much last-mile reliability matters.",
      "After coordinating emergency deliveries during a storm, they became a trusted logistics contact.",
      "An injury season pushed them to redesign routes around safer patterns.",
    ],
    currentFocus: [
      "reduce avoidable route risk during peak hours",
      "share live bottleneck maps with nearby teams",
      "standardize handoff checkpoints for fragile deliveries",
    ],
    personalRules: [
      "Fast only counts if it is safe.",
      "Always leave a backup route.",
      "Confirm handoffs, do not assume them.",
    ],
  },
  {
    role: "storm observer",
    traits: ["analytical", "steady", "prepared", "attentive"],
    quirks: [
      "logs pressure shifts on paper before digital entry",
      "checks the same skyline markers at sunrise and dusk",
      "keeps emergency kits staged by scenario",
    ],
    goals: [
      "improving weather readiness",
      "reducing storm-related disruptions",
      "making risk forecasts easier to act on",
    ],
    communicationStyles: [
      "translates forecasts into clear household actions",
      "uses confidence levels when sharing updates",
      "keeps alerts specific to location and timing",
    ],
    motivations: [
      "early warnings save lives and reduce panic",
      "people should know what to do before impact",
      "risk communication should be accurate and calm",
    ],
    stressBehaviors: [
      "switches to checklist-based updates",
      "broadcasts shorter but more frequent status notes",
      "prioritizes high-risk zones first",
    ],
    origins: [
      "grew up in a flood-prone district where forecasts were daily life",
      "learned observation habits from an emergency volunteer team",
      "started weather logging to support local preparedness groups",
    ],
    pivots: [
      "A near-miss flood event convinced them to standardize neighborhood alerts.",
      "After seeing confusing forecasts cause bad decisions, they focused on plain-language warning systems.",
      "A severe storm season drove them into full-time monitoring work.",
    ],
    currentFocus: [
      "tighten neighborhood alert timing windows",
      "map repeat hazard pockets by microclimate patterns",
      "improve public understanding of uncertainty in forecasts",
    ],
    personalRules: [
      "Accuracy first, urgency second.",
      "Warnings must include clear next actions.",
      "If people cannot interpret it quickly, rewrite it.",
    ],
  },
  {
    role: "urban beekeeper",
    traits: ["careful", "curious", "steady", "gentle"],
    quirks: [
      "names each hive by location trait",
      "records nectar flow like a field journal",
      "checks pollen diversity before expanding colonies",
    ],
    goals: [
      "supporting pollinator health in dense neighborhoods",
      "improving local biodiversity awareness",
      "building practical education around urban ecology",
    ],
    communicationStyles: [
      "explains ecology through everyday examples",
      "frames risk in calm practical terms",
      "teaches by demonstration and repetition",
    ],
    motivations: [
      "pollinators are a visible indicator of ecosystem health",
      "urban nature should feel tangible and teachable",
      "small habitat decisions scale into citywide impact",
    ],
    stressBehaviors: [
      "returns to routine inspection order",
      "pauses expansion plans until stability returns",
      "seeks second observations before intervention",
    ],
    origins: [
      "started with one borrowed hive on a shared rooftop",
      "learned colony care through weekend cooperative programs",
      "was pulled in after volunteering on pollinator surveys",
    ],
    pivots: [
      "A sudden colony collapse pushed them to focus on habitat quality over output.",
      "After teaching kids how pollination works, they expanded into public workshops.",
      "A pesticide incident led them to organize neighborhood planting agreements.",
    ],
    currentFocus: [
      "connect isolated pollinator pockets with better planting corridors",
      "improve hive resilience during heat spikes",
      "pair public education with measurable habitat improvements",
    ],
    personalRules: [
      "Healthy habitat beats short-term yield.",
      "Teach while you build.",
      "Observe twice before you intervene.",
    ],
  },
  {
    role: "public muralist",
    traits: ["expressive", "disciplined", "collaborative", "reflective"],
    quirks: [
      "tests color palettes against different daylight angles",
      "keeps voice notes of community feedback during drafts",
      "starts every concept with a single story sentence",
    ],
    goals: [
      "preserving neighborhood identity through public art",
      "creating spaces where people feel represented",
      "using art to support local cohesion",
    ],
    communicationStyles: [
      "turns abstract ideas into visual prototypes quickly",
      "uses story-first explanations for design choices",
      "invites feedback in structured rounds",
    ],
    motivations: [
      "public walls should reflect local memory",
      "shared visuals can lower social distance",
      "creative work should be accountable to place",
    ],
    stressBehaviors: [
      "returns to rough sketches before refining",
      "asks for direct critique instead of guessing",
      "breaks large concepts into sequence panels",
    ],
    origins: [
      "grew up painting temporary signs for small businesses",
      "learned composition by restoring old neighborhood murals",
      "started as a poster artist for community events",
    ],
    pivots: [
      "A mural restoration project connected them with elders who reshaped their approach.",
      "After a contested design process, they adopted stronger co-design methods.",
      "A vandalism incident led them to build more community ownership into each project.",
    ],
    currentFocus: [
      "co-design murals with youth and longtime residents",
      "pair visual storytelling with local oral history",
      "build maintenance plans so works age well",
    ],
    personalRules: [
      "If locals cannot see themselves in the piece, start over.",
      "Context before style.",
      "Co-design is part of the artwork, not prework.",
    ],
  },
  {
    role: "water systems tech",
    traits: ["practical", "focused", "calm", "systematic"],
    quirks: [
      "keeps pressure readings on index cards by zone",
      "labels valves with both map and street names",
      "runs mini drills for uncommon failure cases",
    ],
    goals: [
      "improving water reliability",
      "reducing leak-related disruptions",
      "hardening critical utility infrastructure",
    ],
    communicationStyles: [
      "explains tradeoffs with concrete operational impacts",
      "uses incident timelines to prevent repeat errors",
      "keeps stakeholders aligned on priorities and dependencies",
    ],
    motivations: [
      "utility failures hit vulnerable residents first",
      "preventive maintenance is cheaper than crisis response",
      "infrastructure trust is built through consistency",
    ],
    stressBehaviors: [
      "segments the system and isolates fault domains",
      "moves to strict incident command language",
      "deprioritizes noncritical work immediately",
    ],
    origins: [
      "started in facility maintenance and moved into district systems",
      "learned utility troubleshooting from night emergency crews",
      "built core skills while restoring aging pipe networks",
    ],
    pivots: [
      "A contamination scare pushed them toward stricter monitoring discipline.",
      "After managing a difficult winter break, they focused on preventative planning.",
      "A mentorship with senior operators changed their approach to documentation.",
    ],
    currentFocus: [
      "reduce response time for high-impact failures",
      "modernize sensor coverage in old network sections",
      "improve cross-team incident handoff quality",
    ],
    personalRules: [
      "Document first, then optimize.",
      "No fix is complete without a prevention step.",
      "Critical systems need calm communication.",
    ],
  },
];

const canvas = document.getElementById("world-canvas");
const ctx = canvas.getContext("2d");

const ui = {
  toggleRun: document.getElementById("toggle-run"),
  regenWorld: document.getElementById("regen-world"),
  toggleAi: document.getElementById("toggle-ai"),
  openApiTrace: document.getElementById("open-api-trace"),
  openWebLlm: document.getElementById("open-web-llm"),
  openConversationLab: document.getElementById("open-conversation-lab"),
  apiKey: document.getElementById("api-key"),
  applyCount: document.getElementById("apply-count"),
  speed: document.getElementById("speed"),
  moveSpeed: document.getElementById("move-speed"),
  agentSize: document.getElementById("agent-size"),
  spaceSize: document.getElementById("space-size"),
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
  movementSpeedMultiplier: 1,
  agentSizeMultiplier: 1,
  spaceScale: 1,
  selectedAgentId: null,
  world: { width: 900, height: 580 },
  lastTimestamp: 0,
  rosterDirty: true,
  selectedDirty: true,
  feedDirty: true,
  aiEnabledByServer: false,
  supportsClientApiKey: false,
  aiModeActive: false,
  aiProviderModel: "zai-glm-4.7",
  apiKey: "",
  activeConversationPairs: new Set(),
  conversations: new Map(),
  conversationCounter: 0,
  turnQueue: [],
  turnInFlight: 0,
  turnConcurrency: 3,
  limitsPollTimer: null,
  talkingAgentCounts: new Map(),
  pagination: {
    rosterPage: 1,
    feedPage: 1,
    contactsPage: 1,
    logPage: 1,
  },
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
  state.apiKey = loadStoredApiKey();
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
  ui.apiKey.value = state.apiKey;

  ui.speed.addEventListener("input", () => {
    state.speedMultiplier = Number(ui.speed.value);
    ui.statSpeed.textContent = `${state.speedMultiplier.toFixed(1)}x`;
  });

  ui.moveSpeed.addEventListener("input", () => {
    state.movementSpeedMultiplier = Number(ui.moveSpeed.value);
  });

  ui.agentSize.addEventListener("input", () => {
    setAgentSizeScale(Number(ui.agentSize.value));
  });

  ui.spaceSize.addEventListener("input", () => {
    setSpaceScale(Number(ui.spaceSize.value));
  });

  ui.toggleRun.addEventListener("click", () => {
    state.running = !state.running;
    ui.toggleRun.textContent = state.running ? "Pause" : "Resume";
  });

  ui.regenWorld.addEventListener("click", () => {
    createWorld(state.agents.length);
  });

  ui.toggleAi.addEventListener("click", () => {
    if (!canUseAiProvider()) return;
    state.aiModeActive = !state.aiModeActive;
    if (!state.aiModeActive) {
      clearConversationState();
    }
    syncAiUi();
    processTurnQueue();
  });

  ui.openApiTrace.addEventListener("click", () => {
    window.open("./api-trace.html", "_blank", "noopener,noreferrer");
  });

  ui.openWebLlm.addEventListener("click", () => {
    window.open("./web-llm.html", "_blank", "noopener,noreferrer");
  });

  ui.openConversationLab.addEventListener("click", () => {
    window.open("./conversation-lab.html", "_blank", "noopener,noreferrer");
  });

  ui.apiKey.addEventListener("input", () => {
    setApiKey(ui.apiKey.value);
  });

  ui.apiKey.addEventListener("change", () => {
    setApiKey(ui.apiKey.value, true);
  });

  ui.apiKey.addEventListener("blur", () => {
    setApiKey(ui.apiKey.value, true);
  });

  ui.applyCount.addEventListener("click", () => {
    const nextCount = clamp(Number(ui.agentCount.value) || SETTINGS.initialAgentCount, 8, 140);
    ui.agentCount.value = String(nextCount);
    createWorld(nextCount);
  });

  ui.agentCount.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    ui.applyCount.click();
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
    state.supportsClientApiKey = Boolean(config.supportsClientApiKey);
    state.aiProviderModel = config.model || "zai-glm-4.7";
    state.aiModeActive = canUseAiProvider();
    renderLimitStats(config.limits);
  } catch {
    state.aiEnabledByServer = false;
    state.supportsClientApiKey = false;
    state.aiModeActive = false;
  }

  syncAiUi();
}

function syncAiUi() {
  const aiAvailable = canUseAiProvider();
  if (!aiAvailable && state.aiModeActive) {
    state.aiModeActive = false;
    clearConversationState();
  }

  ui.toggleAi.disabled = !aiAvailable;
  ui.toggleAi.textContent = state.aiModeActive ? "AI: On" : "AI: Off";
  ui.statDialogue.textContent = state.aiModeActive ? "Cerebras" : "Local";
  ui.toggleAi.title = aiAvailable
    ? `Model: ${state.aiProviderModel}`
    : state.supportsClientApiKey
      ? "Enter a Cerebras API key to enable AI dialogue."
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
  const displayWidth = Math.max(360, rect.width);
  const displayHeight = Math.max(320, rect.height);
  const previousWidth = state.world.width || displayWidth;
  const previousHeight = state.world.height || displayHeight;

  state.world.width = displayWidth * state.spaceScale;
  state.world.height = displayHeight * state.spaceScale;

  canvas.width = Math.floor(displayWidth * dpr);
  canvas.height = Math.floor(displayHeight * dpr);
  ctx.setTransform(dpr / state.spaceScale, 0, 0, dpr / state.spaceScale, 0, 0);

  if (!state.agents.length) return;

  const ratioX = state.world.width / Math.max(1, previousWidth);
  const ratioY = state.world.height / Math.max(1, previousHeight);
  for (const agent of state.agents) {
    agent.x = clamp(agent.x * ratioX, agent.radius, state.world.width - agent.radius);
    agent.y = clamp(agent.y * ratioY, agent.radius, state.world.height - agent.radius);
  }
}

function createWorld(agentCount) {
  state.agents = [];
  state.pairLastInteraction.clear();
  state.globalFeed = [];
  state.recentBursts = [];
  state.interactionCounter = 0;
  state.selectedAgentId = null;
  clearConversationState();
  state.pagination.rosterPage = 1;
  state.pagination.feedPage = 1;
  state.pagination.contactsPage = 1;
  state.pagination.logPage = 1;

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
  const baseRadius = randFloat(SETTINGS.minRadius, SETTINGS.maxRadius);
  const radius = baseRadius * state.agentSizeMultiplier;

  return {
    id,
    x: randFloat(radius, state.world.width - radius),
    y: randFloat(radius, state.world.height - radius),
    baseRadius,
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
  const archetype = pick(PERSONA_ARCHETYPES);
  const role = archetype.role;
  const trait = pick(archetype.traits);
  const secondaryTrait = pickDifferent(archetype.traits, trait);
  const quirk = pick(archetype.quirks);
  const goal = pick(archetype.goals);
  const communicationStyle = pick(archetype.communicationStyles);
  const motivation = pick(archetype.motivations);
  const stressBehavior = pick(archetype.stressBehaviors);
  const personalRule = pick(archetype.personalRules);

  const lifeStory = `${first} ${pick(archetype.origins)}. ${pick(archetype.pivots)} Now they work as a ${role} and focus on ${pick(
    archetype.currentFocus
  )}. Their personal rule is: "${personalRule}"`;
  const personalitySummary = `${first} is ${trait} and ${secondaryTrait}, usually ${communicationStyle.toLowerCase()}. They are driven by ${motivation.toLowerCase()} and tend to ${stressBehavior.toLowerCase()} when pressure spikes.`;

  return {
    seed,
    name,
    role,
    trait,
    secondaryTrait,
    quirk,
    goal,
    communicationStyle,
    motivation,
    stressBehavior,
    personalRule,
    personalitySummary,
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
    if (isAgentTalking(agent.id)) {
      continue;
    }

    agent.headingTimer -= deltaSeconds;
    if (agent.headingTimer <= 0) {
      agent.targetHeading = randFloat(0, Math.PI * 2);
      agent.headingTimer = randFloat(0.9, 3.0);
    }

    const headingDiff = normalizeAngle(agent.targetHeading - agent.heading);
    agent.heading += headingDiff * Math.min(1, deltaSeconds * 1.8);

    const velocity = SETTINGS.baseSpeed * state.movementSpeedMultiplier * agent.speedFactor;
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

      const aTalking = isAgentTalking(a.id);
      const bTalking = isAgentTalking(b.id);

      if (aTalking && !bTalking) {
        b.x += nx * overlap;
        b.y += ny * overlap;
      } else if (!aTalking && bTalking) {
        a.x -= nx * overlap;
        a.y -= ny * overlap;
      } else if (!aTalking && !bTalking) {
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;
      }

      const pairKey = makePairKey(a.id, b.id);
      if (aTalking || bTalking || state.activeConversationPairs.has(pairKey)) {
        continue;
      }

      const lastAt = state.pairLastInteraction.get(pairKey) || 0;
      if (timestamp - lastAt >= SETTINGS.interactionCooldownMs) {
        state.pairLastInteraction.set(pairKey, timestamp);
        if (state.aiModeActive && canUseAiProvider()) {
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
  state.pagination.feedPage = 1;

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
  markAgentTalking(a.id);
  markAgentTalking(b.id);

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
  if (!state.aiModeActive || !canUseAiProvider()) return;

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
    const headers = {
      "Content-Type": "application/json",
    };
    if (state.apiKey) {
      headers["x-cerebras-api-key"] = state.apiKey;
    }

    const response = await fetch("/api/conversation-turn", {
      method: "POST",
      headers,
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
  unmarkAgentTalking(session.aId);
  unmarkAgentTalking(session.bId);
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
  for (const session of state.conversations.values()) {
    unmarkAgentTalking(session.aId);
    unmarkAgentTalking(session.bId);
  }
  state.activeConversationPairs.clear();
  state.conversations.clear();
  state.turnQueue = [];
  state.talkingAgentCounts.clear();
}

function serializeAgentForAi(agent) {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    trait: agent.trait,
    secondaryTrait: agent.secondaryTrait,
    quirk: agent.quirk,
    goal: agent.goal,
    communicationStyle: agent.communicationStyle,
    motivation: agent.motivation,
    stressBehavior: agent.stressBehavior,
    personalRule: agent.personalRule,
    personalitySummary: agent.personalitySummary,
    lifeStory: agent.lifeStory,
  };
}

function generateDialogue(a, b) {
  const topic = pick([a.goal, b.goal, a.motivation || "shared routines", b.motivation || "street logistics"]);
  const opener = pick(WORD_BANK.openers);
  const reply = pick(WORD_BANK.replies);
  const verb = pick(WORD_BANK.verbs);

  const aLine = `${a.name.split(" ")[0]}: "${opener} - I am focused on ${a.goal.toLowerCase()}."`;
  const bLine = `${b.name.split(" ")[0]}: "${reply}. ${b.communicationStyle || "I keep it practical"} and ${b.quirk.toLowerCase()} helps when ${topic.toLowerCase()} gets messy."`;
  const summary = `${a.name} and ${b.name} ${verb} ideas about ${topic.toLowerCase()}.`;

  return { aLine, bLine, summary };
}

function localTurnFromSeed(session, speaker, listener, allowEnd) {
  const idx = session.history.length;
  const speakerFirst = speaker.name.split(" ")[0];
  const listenerFirst = listener.name.split(" ")[0];
  const seedLines = [
    `${speakerFirst}: "I keep thinking about ${speaker.goal.toLowerCase()} and how to make it more practical."`,
    `${speakerFirst}: "That connects with your point, ${listenerFirst}. ${speaker.communicationStyle || "I want to keep this clear and actionable"}."`,
    `${speakerFirst}: "Maybe we can run a small test this week, then adjust from what we learn."`,
    `${speakerFirst}: "Under pressure I usually ${speaker.stressBehavior || "slow down and structure the next step"}, so this is what I suggest next."`,
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
  const sortedAgents = state.agents.slice().sort((a, b) => b.interactionCount - a.interactionCount);
  const page = paginate(sortedAgents, state.pagination.rosterPage, SETTINGS.rosterPageSize);
  state.pagination.rosterPage = page.page;

  const rows = page.items
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

  ui.agentRoster.innerHTML = `${rows || "<p class='empty-feed'>No agents.</p>"}${renderPager("roster", page.page, page.totalPages)}`;
  ui.agentRoster.querySelectorAll(".roster-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      state.selectedAgentId = id;
      state.pagination.contactsPage = 1;
      state.pagination.logPage = 1;
      state.rosterDirty = true;
      state.selectedDirty = true;
    });
  });

  wirePager(ui.agentRoster, "roster", (action) => {
    state.pagination.rosterPage += action === "next" ? 1 : -1;
    state.rosterDirty = true;
  });
}

function renderSelectedAgent() {
  const agent = findAgentById(state.selectedAgentId);
  if (!agent) {
    ui.selectedAgent.className = "selected-agent empty";
    ui.selectedAgent.innerHTML = "<p>No agent selected.</p>";
    return;
  }

  const contactPage = paginate(agent.recentContacts, state.pagination.contactsPage, SETTINGS.contactPageSize);
  const logPage = paginate(agent.interactionLog, state.pagination.logPage, SETTINGS.logPageSize);
  state.pagination.contactsPage = contactPage.page;
  state.pagination.logPage = logPage.page;

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
      <span>${escapeHtml(agent.secondaryTrait || "")}</span>
      <span>${escapeHtml(agent.quirk)}</span>
    </div>
    <p class="story">${escapeHtml(agent.personalitySummary || "")}</p>
    <p class="story">${escapeHtml(agent.lifeStory)}</p>
    <div class="memory-grid">
      <div>
        <h4>Recent Contacts (${agent.recentContacts.length}/100)</h4>
        <div class="memory-list">
          ${contactPage.items
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
        ${renderPager("contacts", contactPage.page, contactPage.totalPages)}
      </div>
      <div>
        <h4>Interaction Log (${agent.interactionLog.length}/100)</h4>
        <div class="memory-list">
          ${logPage.items
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
        ${renderPager("log", logPage.page, logPage.totalPages)}
      </div>
    </div>
  `;

  wirePager(ui.selectedAgent, "contacts", (action) => {
    state.pagination.contactsPage += action === "next" ? 1 : -1;
    state.selectedDirty = true;
  });

  wirePager(ui.selectedAgent, "log", (action) => {
    state.pagination.logPage += action === "next" ? 1 : -1;
    state.selectedDirty = true;
  });
}

function renderFeed() {
  const page = paginate(state.globalFeed, state.pagination.feedPage, SETTINGS.feedPageSize);
  state.pagination.feedPage = page.page;

  const items = page.items
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

  ui.globalFeed.innerHTML = `${items || "<p class='empty-feed'>No interactions yet.</p>"}${renderPager("feed", page.page, page.totalPages)}`;

  wirePager(ui.globalFeed, "feed", (action) => {
    state.pagination.feedPage += action === "next" ? 1 : -1;
    state.feedDirty = true;
  });
}

function handleCanvasClick(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * state.spaceScale;
  const y = (event.clientY - rect.top) * state.spaceScale;

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
  state.pagination.contactsPage = 1;
  state.pagination.logPage = 1;

  state.rosterDirty = true;
  state.selectedDirty = true;
}

function findAgentById(id) {
  if (!id) return null;
  return state.agents.find((agent) => agent.id === id) || null;
}

function isAgentTalking(agentId) {
  return (state.talkingAgentCounts.get(agentId) || 0) > 0;
}

function markAgentTalking(agentId) {
  state.talkingAgentCounts.set(agentId, (state.talkingAgentCounts.get(agentId) || 0) + 1);
}

function unmarkAgentTalking(agentId) {
  const next = (state.talkingAgentCounts.get(agentId) || 0) - 1;
  if (next <= 0) {
    state.talkingAgentCounts.delete(agentId);
  } else {
    state.talkingAgentCounts.set(agentId, next);
  }
}

function paginate(items, requestedPage, pageSize) {
  const totalItems = Array.isArray(items) ? items.length : 0;
  const safeSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const page = clamp(Number(requestedPage) || 1, 1, totalPages);
  const start = (page - 1) * safeSize;
  const end = start + safeSize;
  const pageItems = items.slice(start, end);

  return {
    items: pageItems,
    page,
    totalPages,
  };
}

function renderPager(scope, page, totalPages) {
  if (totalPages <= 1) return "";
  const prevDisabled = page <= 1 ? "disabled" : "";
  const nextDisabled = page >= totalPages ? "disabled" : "";

  return `
    <div class="pager" data-pager-scope="${scope}">
      <button type="button" class="pager-btn" data-pager-action="prev" ${prevDisabled}>Prev</button>
      <span class="pager-label">Page ${page}/${totalPages}</span>
      <button type="button" class="pager-btn" data-pager-action="next" ${nextDisabled}>Next</button>
    </div>
  `;
}

function wirePager(root, scope, onMove) {
  const pager = root.querySelector(`[data-pager-scope="${scope}"]`);
  if (!pager) return;

  pager.querySelectorAll("[data-pager-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.hasAttribute("disabled")) return;
      onMove(btn.dataset.pagerAction);
    });
  });
}

function loadStoredApiKey() {
  try {
    const stored = window.localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored !== null) return String(stored).trim();
  } catch {
    // Ignore storage access failures and use fallback.
  }
  return DEFAULT_CEREBRAS_API_KEY;
}

function saveApiKey(value) {
  try {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, value);
  } catch {
    // Ignore storage write failures.
  }
}

function setApiKey(nextValue, persist = false) {
  state.apiKey = String(nextValue || "").trim();

  if (ui.apiKey.value !== state.apiKey) {
    ui.apiKey.value = state.apiKey;
  }

  if (persist) {
    saveApiKey(state.apiKey);
  }

  syncAiUi();
}

function canUseAiProvider() {
  return state.aiEnabledByServer || (state.supportsClientApiKey && Boolean(state.apiKey));
}

function setSpaceScale(nextScale) {
  const safeScale = clamp(Number(nextScale) || 1, 0.6, 2.4);
  if (state.spaceScale === safeScale) return;
  state.spaceScale = safeScale;
  resizeCanvas();
}

function setAgentSizeScale(nextScale) {
  const safeScale = clamp(Number(nextScale) || 1, 0.6, 2.2);
  state.agentSizeMultiplier = safeScale;

  for (const agent of state.agents) {
    const baseRadius = Number(agent.baseRadius || agent.radius || SETTINGS.minRadius);
    agent.baseRadius = baseRadius;
    agent.radius = baseRadius * state.agentSizeMultiplier;
    agent.x = clamp(agent.x, agent.radius, state.world.width - agent.radius);
    agent.y = clamp(agent.y, agent.radius, state.world.height - agent.radius);
  }
}

function makePairKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickDifferent(list, current) {
  if (!Array.isArray(list) || list.length === 0) return current;
  if (list.length === 1) return list[0];
  let next = current;
  let guard = 0;
  while (next === current && guard < 12) {
    next = pick(list);
    guard += 1;
  }
  return next;
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
  const speaker = speakerName.split(" ")[0];
  const speakerPrefix = `${speaker}:`;
  const startsWithName = cleaned.toLowerCase().startsWith(speakerPrefix.toLowerCase());
  if (startsWithName) {
    const body = cleaned.slice(speakerPrefix.length).trim().replace(/^["']|["']$/g, "");
    if (body.length < 4) return null;
    return `${speakerPrefix} "${body.slice(0, 180)}"`;
  }
  return `${speakerPrefix} "${cleaned.slice(0, 180)}"`;
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
