import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Cerebras } from "@cerebras/cerebras_cloud_sdk";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8080);

const config = {
  model: process.env.CEREBRAS_MODEL || "zai-glm-4.7",
  temperature: readNumber("CEREBRAS_TEMPERATURE", 1),
  topP: readNumber("CEREBRAS_TOP_P", 0.95),
  interactionMaxCompletionTokens: readNumber("CEREBRAS_MAX_COMPLETION_TOKENS", 1200),
  turnMaxCompletionTokens: readNumber("CEREBRAS_TURN_MAX_COMPLETION_TOKENS", 320),
  disableReasoning: readBool("CEREBRAS_DISABLE_REASONING", false),
  clearThinking: readBool("CEREBRAS_CLEAR_THINKING", false),
};

const limits = {
  requestsPerSecond: readNumber("CEREBRAS_LIMIT_RPS", 5),
  tokensPerMinute: readNumber("CEREBRAS_LIMIT_TPM", 1_000_000),
  tokensPerDay: readNumber("CEREBRAS_LIMIT_TPD", 24_000_000),
  maxConcurrent: readNumber("CEREBRAS_LIMIT_CONCURRENCY", 5),
};

const apiKey = process.env.CEREBRAS_API_KEY || "";
const client = apiKey ? new Cerebras({ apiKey }) : null;

const scheduler = {
  queue: [],
  inFlight: 0,
  requestWindow: [],
  minuteTokenWindow: [],
  dayTokenWindow: [],
  totalRequestsDispatched: 0,
  totalTokensObserved: 0,
  totalRequestsRejected: 0,
  timer: null,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "1mb" }));

app.get("/api/config", (_req, res) => {
  res.json({
    cerebrasEnabled: Boolean(client),
    model: config.model,
    temperature: config.temperature,
    top_p: config.topP,
    disable_reasoning: config.disableReasoning,
    clear_thinking: config.clearThinking,
    limits: {
      requests_per_second: limits.requestsPerSecond,
      tokens_per_minute: limits.tokensPerMinute,
      tokens_per_day: limits.tokensPerDay,
      max_concurrent: limits.maxConcurrent,
    },
  });
});

app.get("/api/limits", (_req, res) => {
  res.json(getLimitSnapshot());
});

app.post("/api/interaction", async (req, res) => {
  if (!client) {
    res.status(503).json({
      error: "Cerebras API key is not configured on the server.",
    });
    return;
  }

  const a = sanitizeAgent(req.body?.a);
  const b = sanitizeAgent(req.body?.b);
  if (!a || !b) {
    res.status(400).json({ error: "Request body must include agents 'a' and 'b'." });
    return;
  }

  const fallback = localInteractionFallback(a, b);
  const promptPayload = {
    task: "Generate one short interaction between agent A and agent B.",
    constraints: {
      aLine: "Start with A first name and a colon. Keep under 180 characters, plain text.",
      bLine: "Start with B first name and a colon. Keep under 180 characters, plain text.",
      summary: "One sentence under 140 characters describing what they discussed.",
    },
    agentA: a,
    agentB: b,
  };

  try {
    const estimatedTokens = estimateTokens(JSON.stringify(promptPayload)) + config.interactionMaxCompletionTokens;
    const { response, usage } = await enqueueCerebrasJob(
      () =>
        client.chat.completions.create({
          model: config.model,
          messages: [
            {
              role: "system",
              content:
                "You write concise dialogue for simulated agents. Return only valid JSON with keys aLine, bLine, summary.",
            },
            {
              role: "user",
              content: JSON.stringify(promptPayload),
            },
          ],
          temperature: config.temperature,
          top_p: config.topP,
          max_completion_tokens: config.interactionMaxCompletionTokens,
          disable_reasoning: config.disableReasoning,
          clear_thinking: config.clearThinking,
        }),
      { estimatedTokens }
    );

    const parsed = parseInteractionPayload(extractModelText(response));
    if (!parsed) {
      res.json({
        ...fallback,
        queue: getLimitSnapshot().queue,
        usage,
      });
      return;
    }

    const aLine = normalizeLine(parsed.aLine, a.name);
    const bLine = normalizeLine(parsed.bLine, b.name);
    const summary = normalizeSummary(parsed.summary);
    if (!aLine || !bLine || !summary) {
      res.json({
        ...fallback,
        queue: getLimitSnapshot().queue,
        usage,
      });
      return;
    }

    res.json({
      aLine,
      bLine,
      summary,
      usage,
      queue: getLimitSnapshot().queue,
    });
  } catch (error) {
    if (error?.code === "daily_token_limit_exceeded") {
      res.status(429).json({
        error: "Daily token limit reached.",
        code: error.code,
        queue: getLimitSnapshot().queue,
      });
      return;
    }

    console.error("Cerebras interaction request failed:", error?.message || error);
    res.json({
      ...fallback,
      queue: getLimitSnapshot().queue,
    });
  }
});

app.post("/api/conversation-turn", async (req, res) => {
  if (!client) {
    res.status(503).json({
      error: "Cerebras API key is not configured on the server.",
    });
    return;
  }

  const speaker = sanitizeAgent(req.body?.speaker);
  const listener = sanitizeAgent(req.body?.listener);
  const history = sanitizeHistory(req.body?.history);
  const turnIndex = clampInt(req.body?.turnIndex, 0, 200);
  const maxTurns = clampInt(req.body?.maxTurns, 2, 24);
  const allowEnd = Boolean(req.body?.allowEnd);

  if (!speaker || !listener) {
    res.status(400).json({ error: "Body must include 'speaker' and 'listener' agent objects." });
    return;
  }

  const fallback = localTurnFallback({
    speaker,
    listener,
    history,
    turnIndex,
    maxTurns,
    allowEnd,
  });

  const promptPayload = {
    task: "Generate the next single line in a turn-based conversation between two agents.",
    outputSchema: {
      line: "single dialogue line from the speaker, plain text, starts with speaker first name and colon",
      shouldEnd: "boolean, true only if conversation should naturally conclude now",
      summary: "one short sentence summarizing current conversation state",
    },
    constraints: {
      keepLineUnderChars: 180,
      noMarkdown: true,
      noStageDirections: true,
      alternateTurns: true,
      turnIndex,
      maxTurns,
      allowEnd,
    },
    speaker,
    listener,
    recentHistory: history.slice(-10),
  };

  try {
    const estimatedTokens = estimateTokens(JSON.stringify(promptPayload)) + config.turnMaxCompletionTokens;
    const { response, usage } = await enqueueCerebrasJob(
      () =>
        client.chat.completions.create({
          model: config.model,
          messages: [
            {
              role: "system",
              content:
                "You generate one conversational turn for an agent simulation. Return only JSON with keys line, shouldEnd, summary.",
            },
            {
              role: "user",
              content: JSON.stringify(promptPayload),
            },
          ],
          temperature: config.temperature,
          top_p: config.topP,
          max_completion_tokens: config.turnMaxCompletionTokens,
          disable_reasoning: config.disableReasoning,
          clear_thinking: config.clearThinking,
        }),
      { estimatedTokens }
    );

    const parsed = parseTurnPayload(extractModelText(response));
    if (!parsed) {
      res.json({
        ...fallback,
        usage,
        queue: getLimitSnapshot().queue,
      });
      return;
    }

    const line = normalizeLine(parsed.line, speaker.name);
    const summary = normalizeSummary(parsed.summary);
    const shouldEnd = normalizeShouldEnd(parsed.shouldEnd, allowEnd, turnIndex, maxTurns);

    if (!line || !summary) {
      res.json({
        ...fallback,
        usage,
        queue: getLimitSnapshot().queue,
      });
      return;
    }

    res.json({
      line,
      shouldEnd,
      summary,
      usage,
      queue: getLimitSnapshot().queue,
    });
  } catch (error) {
    if (error?.code === "daily_token_limit_exceeded") {
      res.status(429).json({
        error: "Daily token limit reached.",
        code: error.code,
        queue: getLimitSnapshot().queue,
      });
      return;
    }

    console.error("Cerebras conversation-turn request failed:", error?.message || error);
    res.json({
      ...fallback,
      queue: getLimitSnapshot().queue,
    });
  }
});

app.use(express.static(__dirname));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(
    [
      `agent-space listening on http://localhost:${port}`,
      client ? `Cerebras enabled (${config.model})` : "Cerebras disabled (missing CEREBRAS_API_KEY)",
      `Queue limits: ${limits.requestsPerSecond} rps, ${limits.tokensPerMinute} tpm, ${limits.tokensPerDay} tpd`,
    ].join(" | ")
  );
});

function enqueueCerebrasJob(requestFactory, options = {}) {
  if (!client) {
    return Promise.reject(new Error("Cerebras API key is not configured."));
  }

  const estimatedTokens = Math.max(1, Number(options.estimatedTokens || 1_200));

  return new Promise((resolve, reject) => {
    scheduler.queue.push({
      requestFactory,
      estimatedTokens,
      resolve,
      reject,
      enqueuedAt: Date.now(),
    });
    pumpQueue();
  });
}

function pumpQueue() {
  let minWaitMs = null;

  while (scheduler.queue.length > 0) {
    const job = scheduler.queue[0];
    const gate = gateForDispatch(job);

    if (!gate.ok) {
      if (gate.hardReject) {
        scheduler.totalRequestsRejected += 1;
        scheduler.queue.shift();
        const error = new Error(gate.reason);
        error.code = gate.reason;
        job.reject(error);
        continue;
      }

      minWaitMs = minWaitMs == null ? gate.waitMs : Math.min(minWaitMs, gate.waitMs);
      break;
    }

    scheduler.queue.shift();
    dispatchJob(job);
  }

  if (scheduler.queue.length > 0) {
    schedulePump(minWaitMs ?? 40);
  }
}

function gateForDispatch(job) {
  const now = Date.now();
  pruneWindows(now);

  if (scheduler.inFlight >= limits.maxConcurrent) {
    return { ok: false, waitMs: 40 };
  }

  if (scheduler.requestWindow.length >= limits.requestsPerSecond) {
    const oldestReq = scheduler.requestWindow[0] || now;
    return {
      ok: false,
      waitMs: Math.max(20, oldestReq + 1000 - now),
      reason: "rps_limit",
    };
  }

  const tokensLastMinute = sumTokens(scheduler.minuteTokenWindow);
  const tokensLastDay = sumTokens(scheduler.dayTokenWindow);

  if (tokensLastDay + job.estimatedTokens > limits.tokensPerDay) {
    return {
      ok: false,
      hardReject: true,
      reason: "daily_token_limit_exceeded",
    };
  }

  if (tokensLastMinute + job.estimatedTokens > limits.tokensPerMinute) {
    const oldestMinuteToken = scheduler.minuteTokenWindow[0]?.at || now;
    return {
      ok: false,
      waitMs: Math.max(50, oldestMinuteToken + 60_000 - now),
      reason: "minute_token_limit",
    };
  }

  return { ok: true };
}

async function dispatchJob(job) {
  scheduler.inFlight += 1;
  scheduler.totalRequestsDispatched += 1;
  scheduler.requestWindow.push(Date.now());

  try {
    const response = await job.requestFactory();
    const usage = normalizeUsage(response?.usage, job.estimatedTokens);
    addTokenUsage(usage.totalTokens, Date.now());
    job.resolve({ response, usage });
  } catch (error) {
    job.reject(error);
  } finally {
    scheduler.inFlight -= 1;
    pumpQueue();
  }
}

function addTokenUsage(tokenCount, at) {
  const safeTokens = Math.max(0, Number(tokenCount || 0));
  scheduler.totalTokensObserved += safeTokens;
  scheduler.minuteTokenWindow.push({ at, tokens: safeTokens });
  scheduler.dayTokenWindow.push({ at, tokens: safeTokens });
  pruneWindows(at);
}

function pruneWindows(now) {
  const secondCutoff = now - 1000;
  const minuteCutoff = now - 60_000;
  const dayCutoff = now - 86_400_000;

  while (scheduler.requestWindow.length && scheduler.requestWindow[0] < secondCutoff) {
    scheduler.requestWindow.shift();
  }

  while (scheduler.minuteTokenWindow.length && scheduler.minuteTokenWindow[0].at < minuteCutoff) {
    scheduler.minuteTokenWindow.shift();
  }

  while (scheduler.dayTokenWindow.length && scheduler.dayTokenWindow[0].at < dayCutoff) {
    scheduler.dayTokenWindow.shift();
  }
}

function schedulePump(waitMs) {
  const safeWait = Math.max(10, Number(waitMs || 10));
  if (scheduler.timer) return;
  scheduler.timer = setTimeout(() => {
    scheduler.timer = null;
    pumpQueue();
  }, safeWait);
}

function getLimitSnapshot() {
  const now = Date.now();
  pruneWindows(now);

  const requestsLastSecond = scheduler.requestWindow.length;
  const tokensLastMinute = sumTokens(scheduler.minuteTokenWindow);
  const tokensLastDay = sumTokens(scheduler.dayTokenWindow);
  const minuteRemaining = Math.max(0, limits.tokensPerMinute - tokensLastMinute);
  const dayRemaining = Math.max(0, limits.tokensPerDay - tokensLastDay);

  return {
    limits: {
      requestsPerSecond: limits.requestsPerSecond,
      tokensPerMinute: limits.tokensPerMinute,
      tokensPerDay: limits.tokensPerDay,
      maxConcurrent: limits.maxConcurrent,
    },
    usage: {
      requestsLastSecond,
      tokensLastMinute,
      tokensLastDay,
      minuteRemaining,
      dayRemaining,
      totalRequestsDispatched: scheduler.totalRequestsDispatched,
      totalTokensObserved: scheduler.totalTokensObserved,
      totalRequestsRejected: scheduler.totalRequestsRejected,
    },
    queue: {
      pending: scheduler.queue.length,
      inFlight: scheduler.inFlight,
    },
  };
}

function sumTokens(windowEntries) {
  let total = 0;
  for (const entry of windowEntries) total += Number(entry.tokens || 0);
  return total;
}

function normalizeUsage(rawUsage, fallbackTotal) {
  const promptTokens = toSafeInt(rawUsage?.prompt_tokens);
  const completionTokens = toSafeInt(rawUsage?.completion_tokens);
  const reasoningTokens = toSafeInt(rawUsage?.completion_tokens_details?.reasoning_tokens);
  const totalTokens =
    toSafeInt(rawUsage?.total_tokens) ||
    (promptTokens > 0 || completionTokens > 0 ? promptTokens + completionTokens : toSafeInt(fallbackTotal));

  return {
    promptTokens,
    completionTokens,
    reasoningTokens,
    totalTokens: Math.max(1, totalTokens),
  };
}

function extractModelText(completion) {
  const message = completion?.choices?.[0]?.message || {};
  return [message.content, message.reasoning]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join("\n");
}

function parseInteractionPayload(text) {
  const parsedObjects = parseJsonCandidates(text);
  for (const obj of parsedObjects) {
    if (
      obj &&
      typeof obj === "object" &&
      typeof obj.aLine === "string" &&
      typeof obj.bLine === "string" &&
      typeof obj.summary === "string"
    ) {
      return obj;
    }
  }
  return null;
}

function parseTurnPayload(text) {
  const parsedObjects = parseJsonCandidates(text);
  for (const obj of parsedObjects) {
    if (
      obj &&
      typeof obj === "object" &&
      typeof obj.line === "string" &&
      typeof obj.summary === "string" &&
      (typeof obj.shouldEnd === "boolean" || typeof obj.shouldEnd === "string" || typeof obj.shouldEnd === "number")
    ) {
      return obj;
    }
  }
  return null;
}

function parseJsonCandidates(input) {
  const text = String(input || "").trim();
  if (!text) return [];

  const candidates = [text];
  const fencedBlockPattern = /```(?:json)?\s*([\s\S]*?)```/gi;
  for (const match of text.matchAll(fencedBlockPattern)) {
    if (match[1]) candidates.push(match[1].trim());
  }

  const objects = [];
  for (const candidate of candidates) {
    try {
      objects.push(JSON.parse(candidate));
      continue;
    } catch {
      // Fall through to object scanning.
    }

    const objectPattern = /\{[\s\S]*?\}/g;
    for (const match of candidate.matchAll(objectPattern)) {
      const chunk = match[0];
      try {
        objects.push(JSON.parse(chunk));
      } catch {
        // Ignore malformed chunk.
      }
    }
  }

  return objects;
}

function normalizeShouldEnd(value, allowEnd, turnIndex, maxTurns) {
  const hardCapReached = turnIndex + 1 >= maxTurns;
  if (hardCapReached) return true;
  if (!allowEnd) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return ["true", "yes", "1", "end", "done"].includes(value.toLowerCase());
  return false;
}

function readBool(name, defaultValue) {
  const raw = process.env[name];
  if (raw == null || raw === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

function readNumber(name, defaultValue) {
  const raw = process.env[name];
  if (raw == null || raw === "") return defaultValue;
  const value = Number(raw);
  return Number.isFinite(value) ? value : defaultValue;
}

function toSafeInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function firstName(fullName) {
  return String(fullName || "").trim().split(/\s+/)[0] || "Agent";
}

function sanitizeAgent(value) {
  if (!value || typeof value !== "object") return null;
  const name = String(value.name || "").trim();
  if (!name) return null;

  return {
    id: value.id,
    name,
    role: String(value.role || "").trim(),
    trait: String(value.trait || "").trim(),
    quirk: String(value.quirk || "").trim(),
    goal: String(value.goal || "").trim(),
    lifeStory: String(value.lifeStory || "").trim(),
  };
}

function sanitizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-20)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const line = String(entry.line || "").trim();
      const speakerId = entry.speakerId;
      if (!line) return null;
      return {
        speakerId,
        line: line.slice(0, 220),
      };
    })
    .filter(Boolean);
}

function normalizeLine(value, speakerName) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;

  const speaker = firstName(speakerName);
  if (cleaned.toLowerCase().startsWith(`${speaker.toLowerCase()}:`)) {
    return cleaned.slice(0, 220);
  }
  return `${speaker}: "${cleaned.slice(0, 180)}"`;
}

function normalizeSummary(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, 220) : null;
}

function estimateTokens(text) {
  const chars = String(text || "").length;
  return Math.max(1, Math.ceil(chars / 4));
}

function localInteractionFallback(a, b) {
  const aFirst = firstName(a.name);
  const bFirst = firstName(b.name);
  return {
    aLine: `${aFirst}: "I keep circling back to ${a.goal || "what works for people day-to-day"}."`,
    bLine: `${bFirst}: "Same here. ${b.quirk || "My routine"} helps when plans get noisy."`,
    summary: `${a.name} and ${b.name} compared ideas about neighborhood routines.`,
  };
}

function localTurnFallback({ speaker, listener, history, turnIndex, maxTurns, allowEnd }) {
  const speakerFirst = firstName(speaker.name);
  const listenerFirst = firstName(listener.name);
  const seeds = [
    `${speakerFirst}: "I keep thinking about ${speaker.goal.toLowerCase()}."`,
    `${speakerFirst}: "My ${speaker.quirk.toLowerCase()} usually helps me make sense of this."`,
    `${speakerFirst}: "Could we test a small step by tomorrow?"`,
    `${speakerFirst}: "Your angle on this is useful, ${listenerFirst}."`,
  ];

  const line = seeds[turnIndex % seeds.length];
  const shouldEnd = turnIndex + 1 >= maxTurns || (allowEnd && turnIndex >= 3 && Math.random() < 0.35);
  const summary = `${speaker.name} and ${listener.name} are discussing practical next steps.`;

  const prior = history[history.length - 1];
  if (prior && prior.line) {
    return {
      line: `${speakerFirst}: "On what you said, I can adjust the plan a bit."`,
      shouldEnd,
      summary,
    };
  }

  return { line, shouldEnd, summary };
}
