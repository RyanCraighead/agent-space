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

const DEFAULT_PROMPTS = {
  interactionSystem:
    'Return only minified JSON: {"aLine":"...","bLine":"...","summary":"..."} with no extra text.',
  interactionTask: "Generate one short interaction between agent A and agent B.",
  turnSystem:
    'Return only minified JSON: {"line":"...","shouldEnd":false,"summary":"..."}. "line" must include a complete sentence after the speaker name and colon.',
  turnTask: "Generate the next single line in a turn-based conversation between two agents.",
  labSystem:
    'You simulate one turn in a 2-agent chat test. Stay consistent with each agent system instruction. Return only minified JSON: {"line":"...","shouldEnd":false,"summary":"..."}',
  labTask: "Generate one conversational turn from the current speaker.",
};

const DEFAULT_CONSTRAINTS = {
  interactionLineMaxChars: 180,
  interactionSummaryMaxChars: 140,
  turnLineMaxChars: 180,
  turnSummaryMaxChars: 220,
  turnMinCharsAfterSpeaker: 18,
  turnNoMarkdown: true,
  turnNoStageDirections: true,
  turnAlternateTurns: true,
};

const runtimeSettings = {
  model: config.model,
  temperature: config.temperature,
  topP: config.topP,
  interactionMaxCompletionTokens: config.interactionMaxCompletionTokens,
  turnMaxCompletionTokens: config.turnMaxCompletionTokens,
  disableReasoning: config.disableReasoning,
  clearThinking: config.clearThinking,
  prompts: { ...DEFAULT_PROMPTS },
  constraints: { ...DEFAULT_CONSTRAINTS },
};
runtimeSettings.constraints = normalizeRuntimeConstraints(runtimeSettings.constraints);

const modelFallbacks = readModelList("CEREBRAS_MODEL_FALLBACKS", ["llama3.1-8b", "gpt-oss-120b"]);
const runtimeModel = {
  active: runtimeSettings.model,
};

const limits = {
  requestsPerSecond: readNumber("CEREBRAS_LIMIT_RPS", 5),
  tokensPerMinute: readNumber("CEREBRAS_LIMIT_TPM", 1_000_000),
  tokensPerDay: readNumber("CEREBRAS_LIMIT_TPD", 24_000_000),
  maxConcurrent: readNumber("CEREBRAS_LIMIT_CONCURRENCY", 5),
};

const defaultApiKey = process.env.CEREBRAS_API_KEY || "";
const defaultClient = defaultApiKey ? new Cerebras({ apiKey: defaultApiKey }) : null;

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

const debugLogs = {
  enabled: readBool("CEREBRAS_DEBUG_LOGS_ENABLED", true),
  maxEntries: readNumber("CEREBRAS_DEBUG_LOGS_MAX", 300),
  nextId: 1,
  entries: [],
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "1mb" }));

app.get("/api/config", (_req, res) => {
  res.json({
    cerebrasEnabled: Boolean(defaultClient),
    supportsClientApiKey: true,
    model: runtimeModel.active,
    temperature: runtimeSettings.temperature,
    top_p: runtimeSettings.topP,
    disable_reasoning: runtimeSettings.disableReasoning,
    clear_thinking: runtimeSettings.clearThinking,
    turn_max_completion_tokens: runtimeSettings.turnMaxCompletionTokens,
    interaction_max_completion_tokens: runtimeSettings.interactionMaxCompletionTokens,
    constraints: {
      ...runtimeSettings.constraints,
    },
    limits: {
      requests_per_second: limits.requestsPerSecond,
      tokens_per_minute: limits.tokensPerMinute,
      tokens_per_day: limits.tokensPerDay,
      max_concurrent: limits.maxConcurrent,
    },
  });
});

app.get("/api/runtime-settings", (_req, res) => {
  res.json(getRuntimeSettingsSnapshot());
});

app.put("/api/runtime-settings", (req, res) => {
  const next = sanitizeRuntimeSettingsPatch(req.body);

  if (Object.prototype.hasOwnProperty.call(next, "model")) {
    runtimeSettings.model = next.model;
    runtimeModel.active = next.model;
  }
  if (Object.prototype.hasOwnProperty.call(next, "temperature")) {
    runtimeSettings.temperature = next.temperature;
  }
  if (Object.prototype.hasOwnProperty.call(next, "topP")) {
    runtimeSettings.topP = next.topP;
  }
  if (Object.prototype.hasOwnProperty.call(next, "interactionMaxCompletionTokens")) {
    runtimeSettings.interactionMaxCompletionTokens = next.interactionMaxCompletionTokens;
  }
  if (Object.prototype.hasOwnProperty.call(next, "turnMaxCompletionTokens")) {
    runtimeSettings.turnMaxCompletionTokens = next.turnMaxCompletionTokens;
  }
  if (Object.prototype.hasOwnProperty.call(next, "disableReasoning")) {
    runtimeSettings.disableReasoning = next.disableReasoning;
  }
  if (Object.prototype.hasOwnProperty.call(next, "clearThinking")) {
    runtimeSettings.clearThinking = next.clearThinking;
  }
  if (next.prompts) {
    runtimeSettings.prompts = {
      ...runtimeSettings.prompts,
      ...next.prompts,
    };
  }
  if (next.constraints) {
    runtimeSettings.constraints = {
      ...runtimeSettings.constraints,
      ...next.constraints,
    };
    runtimeSettings.constraints = normalizeRuntimeConstraints(runtimeSettings.constraints);
  }

  res.json(getRuntimeSettingsSnapshot());
});

app.get("/api/limits", (_req, res) => {
  res.json(getLimitSnapshot());
});

app.get("/api/debug/logs", (req, res) => {
  const limit = clampInt(req.query.limit, 1, 500);
  const entries = debugLogs.entries.slice(-limit).reverse();
  res.json({
    enabled: debugLogs.enabled,
    total: debugLogs.entries.length,
    entries,
  });
});

app.delete("/api/debug/logs", (_req, res) => {
  debugLogs.entries = [];
  res.json({ ok: true });
});

app.post("/api/interaction", async (req, res) => {
  const requestClient = resolveRequestClient(req);
  if (!requestClient) {
    res.status(503).json({
      error: "Cerebras API key is not configured. Set CEREBRAS_API_KEY or pass x-cerebras-api-key.",
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
    task: runtimeSettings.prompts.interactionTask,
    constraints: {
      aLine: `Start with A first name and a colon. Keep under ${runtimeSettings.constraints.interactionLineMaxChars} characters, plain text.`,
      bLine: `Start with B first name and a colon. Keep under ${runtimeSettings.constraints.interactionLineMaxChars} characters, plain text.`,
      summary: `One sentence under ${runtimeSettings.constraints.interactionSummaryMaxChars} characters describing what they discussed.`,
    },
    agentA: a,
    agentB: b,
  };
  const modelMessages = [
    {
      role: "system",
      content: runtimeSettings.prompts.interactionSystem,
    },
    {
      role: "user",
      content: JSON.stringify(promptPayload),
    },
  ];
  const interactionCompletionBudget = Math.max(120, Math.min(runtimeSettings.interactionMaxCompletionTokens, 260));
  const modelRequest = {
    model: runtimeModel.active,
    messages: modelMessages,
    temperature: runtimeSettings.temperature,
    top_p: runtimeSettings.topP,
    max_completion_tokens: interactionCompletionBudget,
    disable_reasoning: runtimeSettings.disableReasoning,
    clear_thinking: runtimeSettings.clearThinking,
  };
  const debugId = createDebugEntry({
    route: "/api/interaction",
    request: {
      input: { a, b },
      promptPayload,
      cerebrasRequest: modelRequest,
      queueBefore: getLimitSnapshot().queue,
    },
  });

  try {
    const estimatedTokens = estimateTokens(JSON.stringify(promptPayload)) + interactionCompletionBudget;
    const { response, usage, requestUsed } = await requestChatCompletion({
      requestClient,
      baseRequest: modelRequest,
      estimatedTokens,
    });

    const rawModel = compactModelResponse(response);
    const parsed = parseInteractionPayload(extractModelText(response));
    if (!parsed) {
      updateDebugEntry(debugId, {
        status: "fallback_parse_failed",
        result: {
          usage,
          rawModel,
          parsed: null,
          response: fallback,
          queueAfter: getLimitSnapshot().queue,
        },
      });
      res.json({
        ...fallback,
        queue: getLimitSnapshot().queue,
        usage,
      });
      return;
    }

    const aLine = normalizeLine(parsed.aLine, a.name, runtimeSettings.constraints.interactionLineMaxChars);
    const bLine = normalizeLine(parsed.bLine, b.name, runtimeSettings.constraints.interactionLineMaxChars);
    const summary = normalizeSummary(parsed.summary, runtimeSettings.constraints.interactionSummaryMaxChars);
    if (!aLine || !bLine || !summary) {
      updateDebugEntry(debugId, {
        status: "fallback_invalid_shape",
        result: {
          usage,
          rawModel,
          parsed,
          response: fallback,
          queueAfter: getLimitSnapshot().queue,
        },
      });
      res.json({
        ...fallback,
        queue: getLimitSnapshot().queue,
        usage,
      });
      return;
    }

    updateDebugEntry(debugId, {
      status: "completed",
      result: {
        usage,
        rawModel,
        requestUsed,
        parsed,
        response: { aLine, bLine, summary },
        queueAfter: getLimitSnapshot().queue,
      },
    });
    res.json({
      aLine,
      bLine,
      summary,
      usage,
      queue: getLimitSnapshot().queue,
    });
  } catch (error) {
    if (error?.code === "daily_token_limit_exceeded") {
      updateDebugEntry(debugId, {
        status: "rejected_daily_limit",
        error: sanitizeError(error),
        result: {
          response: { error: "Daily token limit reached.", code: error.code },
          queueAfter: getLimitSnapshot().queue,
        },
      });
      res.status(429).json({
        error: "Daily token limit reached.",
        code: error.code,
        queue: getLimitSnapshot().queue,
      });
      return;
    }

    console.error("Cerebras interaction request failed:", error?.message || error);
    updateDebugEntry(debugId, {
      status: "error_fallback",
      error: sanitizeError(error),
      result: {
        response: fallback,
        queueAfter: getLimitSnapshot().queue,
      },
    });
    res.json({
      ...fallback,
      queue: getLimitSnapshot().queue,
    });
  }
});

app.post("/api/conversation-turn", async (req, res) => {
  const requestClient = resolveRequestClient(req);
  if (!requestClient) {
    res.status(503).json({
      error: "Cerebras API key is not configured. Set CEREBRAS_API_KEY or pass x-cerebras-api-key.",
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
    task: runtimeSettings.prompts.turnTask,
    outputSchema: {
      line: "single dialogue line from the speaker, plain text, starts with speaker first name and colon",
      shouldEnd: "boolean, true only if conversation should naturally conclude now",
      summary: "one short sentence summarizing current conversation state",
    },
    constraints: {
      keepLineUnderChars: runtimeSettings.constraints.turnLineMaxChars,
      minCharsAfterSpeaker: runtimeSettings.constraints.turnMinCharsAfterSpeaker,
      noMarkdown: runtimeSettings.constraints.turnNoMarkdown,
      noStageDirections: runtimeSettings.constraints.turnNoStageDirections,
      alternateTurns: runtimeSettings.constraints.turnAlternateTurns,
      turnIndex,
      maxTurns,
      allowEnd,
    },
    speaker,
    listener,
    recentHistory: history.slice(-10),
  };
  const modelMessages = [
    {
      role: "system",
      content: runtimeSettings.prompts.turnSystem,
    },
    {
      role: "user",
      content: JSON.stringify(promptPayload),
    },
  ];
  const turnCompletionBudget = Math.max(120, Math.min(runtimeSettings.turnMaxCompletionTokens, 240));
  const modelRequest = {
    model: runtimeModel.active,
    messages: modelMessages,
    temperature: runtimeSettings.temperature,
    top_p: runtimeSettings.topP,
    max_completion_tokens: turnCompletionBudget,
    disable_reasoning: runtimeSettings.disableReasoning,
    clear_thinking: runtimeSettings.clearThinking,
  };
  const debugId = createDebugEntry({
    route: "/api/conversation-turn",
    request: {
      input: { speaker, listener, history, turnIndex, maxTurns, allowEnd },
      promptPayload,
      cerebrasRequest: modelRequest,
      queueBefore: getLimitSnapshot().queue,
    },
  });

  try {
    const estimatedTokens = estimateTokens(JSON.stringify(promptPayload)) + turnCompletionBudget;
    const { response, usage, requestUsed } = await requestChatCompletion({
      requestClient,
      baseRequest: modelRequest,
      estimatedTokens,
    });

    const rawModel = compactModelResponse(response);
    const parsed = parseTurnPayload(extractModelText(response));
    if (!parsed) {
      updateDebugEntry(debugId, {
        status: "fallback_parse_failed",
        result: {
          usage,
          rawModel,
          parsed: null,
          response: fallback,
          queueAfter: getLimitSnapshot().queue,
        },
      });
      res.json({
        ...fallback,
        usage,
        queue: getLimitSnapshot().queue,
      });
      return;
    }

    const line = normalizeLine(
      parsed.line,
      speaker.name,
      runtimeSettings.constraints.turnLineMaxChars,
      runtimeSettings.constraints.turnMinCharsAfterSpeaker
    );
    const summary = normalizeSummary(parsed.summary, runtimeSettings.constraints.turnSummaryMaxChars);
    const shouldEnd = normalizeShouldEnd(parsed.shouldEnd, allowEnd, turnIndex, maxTurns);

    if (!line || !summary) {
      updateDebugEntry(debugId, {
        status: "fallback_invalid_shape",
        result: {
          usage,
          rawModel,
          parsed,
          response: fallback,
          queueAfter: getLimitSnapshot().queue,
        },
      });
      res.json({
        ...fallback,
        usage,
        queue: getLimitSnapshot().queue,
      });
      return;
    }

    updateDebugEntry(debugId, {
      status: "completed",
      result: {
        usage,
        rawModel,
        requestUsed,
        parsed,
        response: { line, shouldEnd, summary },
        queueAfter: getLimitSnapshot().queue,
      },
    });
    res.json({
      line,
      shouldEnd,
      summary,
      usage,
      queue: getLimitSnapshot().queue,
    });
  } catch (error) {
    if (error?.code === "daily_token_limit_exceeded") {
      updateDebugEntry(debugId, {
        status: "rejected_daily_limit",
        error: sanitizeError(error),
        result: {
          response: { error: "Daily token limit reached.", code: error.code },
          queueAfter: getLimitSnapshot().queue,
        },
      });
      res.status(429).json({
        error: "Daily token limit reached.",
        code: error.code,
        queue: getLimitSnapshot().queue,
      });
      return;
    }

    console.error("Cerebras conversation-turn request failed:", error?.message || error);
    updateDebugEntry(debugId, {
      status: "error_fallback",
      error: sanitizeError(error),
      result: {
        response: fallback,
        queueAfter: getLimitSnapshot().queue,
      },
    });
    res.json({
      ...fallback,
      queue: getLimitSnapshot().queue,
    });
  }
});

app.post("/api/lab/conversation-turn", async (req, res) => {
  const requestClient = resolveRequestClient(req);
  if (!requestClient) {
    res.status(503).json({
      error: "Cerebras API key is not configured. Set CEREBRAS_API_KEY or pass x-cerebras-api-key.",
    });
    return;
  }

  const speaker = sanitizeLabAgent(req.body?.speaker);
  const listener = sanitizeLabAgent(req.body?.listener);
  const history = sanitizeLabHistory(req.body?.history);
  const turnIndex = clampInt(req.body?.turnIndex, 0, 200);
  const maxTurns = clampInt(req.body?.maxTurns, 2, 48);
  const allowEnd = Boolean(req.body?.allowEnd);

  if (!speaker || !listener) {
    res.status(400).json({ error: "Body must include 'speaker' and 'listener' objects with names." });
    return;
  }

  const fallback = localLabTurnFallback({
    speaker,
    listener,
    turnIndex,
    maxTurns,
    allowEnd,
  });

  const historyText = history
    .slice(-18)
    .map((entry) => `${entry.speakerName}: ${entry.line}`)
    .join("\n");

  const modelMessages = [
    {
      role: "system",
      content: runtimeSettings.prompts.labSystem,
    },
    {
      role: "system",
      content: [
        "Current speaker",
        `name: ${speaker.name}`,
        `system_instruction: ${speaker.systemInstruction || "(none)"}`,
        `context: ${speaker.context || "(none)"}`,
      ].join("\n"),
    },
    {
      role: "system",
      content: [
        "Other participant",
        `name: ${listener.name}`,
        `system_instruction: ${listener.systemInstruction || "(none)"}`,
        `context: ${listener.context || "(none)"}`,
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        runtimeSettings.prompts.labTask,
        `turn_index: ${turnIndex}`,
        `max_turns: ${maxTurns}`,
        `allow_end: ${allowEnd}`,
        `line_max_chars: ${runtimeSettings.constraints.turnLineMaxChars}`,
        `summary_max_chars: ${runtimeSettings.constraints.turnSummaryMaxChars}`,
        `min_chars_after_speaker: ${runtimeSettings.constraints.turnMinCharsAfterSpeaker}`,
        `no_markdown: ${runtimeSettings.constraints.turnNoMarkdown}`,
        `no_stage_directions: ${runtimeSettings.constraints.turnNoStageDirections}`,
        `alternate_turns: ${runtimeSettings.constraints.turnAlternateTurns}`,
        "Conversation so far:",
        historyText || "(none)",
      ].join("\n"),
    },
  ];

  const completionBudget = Math.max(120, Math.min(runtimeSettings.turnMaxCompletionTokens, 280));
  const modelRequest = {
    model: runtimeModel.active,
    messages: modelMessages,
    temperature: runtimeSettings.temperature,
    top_p: runtimeSettings.topP,
    max_completion_tokens: completionBudget,
    disable_reasoning: runtimeSettings.disableReasoning,
    clear_thinking: runtimeSettings.clearThinking,
  };

  const debugId = createDebugEntry({
    route: "/api/lab/conversation-turn",
    request: {
      input: { speaker, listener, history, turnIndex, maxTurns, allowEnd },
      cerebrasRequest: modelRequest,
      queueBefore: getLimitSnapshot().queue,
    },
  });

  try {
    const estimatedTokens = estimateTokens(JSON.stringify(modelMessages)) + completionBudget;
    const { response, usage, requestUsed } = await requestChatCompletion({
      requestClient,
      baseRequest: modelRequest,
      estimatedTokens,
    });

    const rawModel = compactModelResponse(response);
    const parsed = parseTurnPayload(extractModelText(response));
    const line = normalizeLine(
      parsed?.line,
      speaker.name,
      runtimeSettings.constraints.turnLineMaxChars,
      runtimeSettings.constraints.turnMinCharsAfterSpeaker
    );
    const summary =
      normalizeSummary(parsed?.summary, runtimeSettings.constraints.turnSummaryMaxChars) ||
      normalizeSummary(fallback.summary, runtimeSettings.constraints.turnSummaryMaxChars);
    const shouldEnd = normalizeShouldEnd(parsed?.shouldEnd, allowEnd, turnIndex, maxTurns);

    if (!line) {
      updateDebugEntry(debugId, {
        status: "fallback_invalid_shape",
        result: {
          usage,
          rawModel,
          requestUsed,
          parsed,
          response: fallback,
          queueAfter: getLimitSnapshot().queue,
        },
      });
      res.json({
        ...fallback,
        usage,
        queue: getLimitSnapshot().queue,
      });
      return;
    }

    const payload = { line, shouldEnd, summary };
    updateDebugEntry(debugId, {
      status: "completed",
      result: {
        usage,
        rawModel,
        requestUsed,
        parsed,
        response: payload,
        queueAfter: getLimitSnapshot().queue,
      },
    });
    res.json({
      ...payload,
      usage,
      queue: getLimitSnapshot().queue,
    });
  } catch (error) {
    console.error("Cerebras lab conversation-turn request failed:", error?.message || error);
    updateDebugEntry(debugId, {
      status: "error_fallback",
      error: sanitizeError(error),
      result: {
        response: fallback,
        queueAfter: getLimitSnapshot().queue,
      },
    });
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
      defaultClient
        ? `Cerebras enabled (preferred ${runtimeModel.active}; fallbacks ${modelFallbacks.join(", ")})`
        : "Cerebras enabled via x-cerebras-api-key request header",
      `Queue limits: ${limits.requestsPerSecond} rps, ${limits.tokensPerMinute} tpm, ${limits.tokensPerDay} tpd`,
    ].join(" | ")
  );
});

function createDebugEntry({ route, request }) {
  if (!debugLogs.enabled) return null;

  const entry = {
    id: debugLogs.nextId++,
    at: new Date().toISOString(),
    route,
    status: "queued",
    request: safeJson(request),
    result: null,
    error: null,
  };

  debugLogs.entries.push(entry);
  trimDebugLogs();
  return entry.id;
}

function updateDebugEntry(id, patch) {
  if (!debugLogs.enabled || !id) return;
  const entry = debugLogs.entries.find((item) => item.id === id);
  if (!entry) return;

  if (patch.status) entry.status = patch.status;
  if (patch.request !== undefined) entry.request = safeJson(patch.request);
  if (patch.result !== undefined) entry.result = safeJson(patch.result);
  if (patch.error !== undefined) entry.error = safeJson(patch.error);
  entry.updatedAt = new Date().toISOString();
}

function trimDebugLogs() {
  const max = Math.max(20, Number(debugLogs.maxEntries || 300));
  if (debugLogs.entries.length <= max) return;
  debugLogs.entries.splice(0, debugLogs.entries.length - max);
}

function compactModelResponse(completion) {
  const choice = completion?.choices?.[0];
  return {
    id: completion?.id,
    model: completion?.model,
    created: completion?.created,
    usage: completion?.usage,
    time_info: completion?.time_info,
    choice: {
      finish_reason: choice?.finish_reason,
      index: choice?.index,
      message: {
        role: choice?.message?.role,
        content: choice?.message?.content,
        reasoning: choice?.message?.reasoning,
      },
    },
  };
}

function sanitizeError(error) {
  if (!error) return null;
  return {
    name: error.name,
    message: error.message,
    code: error.code,
  };
}

function safeJson(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { error: "non_serializable_value" };
  }
}

async function requestChatCompletion({ requestClient, baseRequest, estimatedTokens }) {
  const modelCandidates = uniqueStrings([runtimeModel.active, baseRequest?.model, ...modelFallbacks]);
  let lastError = null;

  for (const model of modelCandidates) {
    const requestWithModel = {
      ...baseRequest,
      model,
    };
    const attemptRequests = [requestWithModel];
    if (hasReasoningOptions(requestWithModel)) {
      attemptRequests.push(stripReasoningOptions(requestWithModel));
    }

    for (const attempt of dedupeRequests(attemptRequests)) {
      try {
        const { response, usage } = await enqueueCerebrasJob(
          () => requestClient.chat.completions.create(attempt),
          { estimatedTokens }
        );
        runtimeModel.active = attempt.model;
        return {
          response,
          usage,
          requestUsed: attempt,
        };
      } catch (error) {
        lastError = error;

        if (isReasoningOptionError(error) && hasReasoningOptions(attempt)) {
          continue;
        }

        if (isModelAccessError(error)) {
          break;
        }

        throw error;
      }
    }
  }

  throw lastError || new Error("No compatible Cerebras model could be selected.");
}

function hasReasoningOptions(request) {
  return Object.prototype.hasOwnProperty.call(request, "disable_reasoning") ||
    Object.prototype.hasOwnProperty.call(request, "clear_thinking");
}

function stripReasoningOptions(request) {
  const next = { ...request };
  delete next.disable_reasoning;
  delete next.clear_thinking;
  return next;
}

function dedupeRequests(requests) {
  const seen = new Set();
  const deduped = [];
  for (const request of requests) {
    const key = JSON.stringify({
      model: request?.model,
      disable_reasoning: request?.disable_reasoning,
      clear_thinking: request?.clear_thinking,
    });
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(request);
  }
  return deduped;
}

function isModelAccessError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("does not exist or you do not have access");
}

function isReasoningOptionError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("clear_thinking") ||
    message.includes("disable_reasoning") ||
    message.includes("disabling reasoning is not supported")
  );
}

function resolveRequestClient(req) {
  const requestApiKey = normalizeApiKey(req.get("x-cerebras-api-key"));
  if (requestApiKey) {
    return new Cerebras({ apiKey: requestApiKey });
  }

  return defaultClient;
}

function normalizeApiKey(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function enqueueCerebrasJob(requestFactory, options = {}) {
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
  const seen = new Set();

  for (const candidate of candidates) {
    const direct = String(candidate || "").trim();
    if (direct && !seen.has(direct)) {
      seen.add(direct);
      try {
        objects.push(JSON.parse(direct));
      } catch {
        // Fall through and try extracting nested objects.
      }
    }

    for (const chunk of extractBalancedJsonObjects(candidate)) {
      const normalized = chunk.trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      try {
        objects.push(JSON.parse(normalized));
      } catch {
        // Ignore malformed chunk.
      }
    }
  }

  return objects;
}

function extractBalancedJsonObjects(text) {
  const source = String(text || "");
  const objects = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (ch === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        objects.push(source.slice(start, i + 1));
        start = -1;
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

function getRuntimeSettingsSnapshot() {
  return {
    model: runtimeModel.active,
    temperature: runtimeSettings.temperature,
    topP: runtimeSettings.topP,
    interactionMaxCompletionTokens: runtimeSettings.interactionMaxCompletionTokens,
    turnMaxCompletionTokens: runtimeSettings.turnMaxCompletionTokens,
    disableReasoning: runtimeSettings.disableReasoning,
    clearThinking: runtimeSettings.clearThinking,
    prompts: {
      ...runtimeSettings.prompts,
    },
    constraints: {
      ...runtimeSettings.constraints,
    },
    modelFallbacks: [...modelFallbacks],
  };
}

function sanitizeRuntimeSettingsPatch(value) {
  const patch = {};
  if (!value || typeof value !== "object") return patch;

  if (typeof value.model === "string" && value.model.trim()) {
    patch.model = value.model.trim().slice(0, 140);
  }
  if (value.temperature !== undefined) {
    patch.temperature = clampNumber(value.temperature, 0, 2, runtimeSettings.temperature);
  }
  if (value.topP !== undefined || value.top_p !== undefined) {
    patch.topP = clampNumber(value.topP ?? value.top_p, 0, 1, runtimeSettings.topP);
  }
  if (value.interactionMaxCompletionTokens !== undefined || value.interaction_max_completion_tokens !== undefined) {
    patch.interactionMaxCompletionTokens = clampInt(
      value.interactionMaxCompletionTokens ?? value.interaction_max_completion_tokens,
      80,
      4096
    );
  }
  if (value.turnMaxCompletionTokens !== undefined || value.turn_max_completion_tokens !== undefined) {
    patch.turnMaxCompletionTokens = clampInt(value.turnMaxCompletionTokens ?? value.turn_max_completion_tokens, 80, 2048);
  }
  if (value.disableReasoning !== undefined || value.disable_reasoning !== undefined) {
    patch.disableReasoning = toBoolean(value.disableReasoning ?? value.disable_reasoning);
  }
  if (value.clearThinking !== undefined || value.clear_thinking !== undefined) {
    patch.clearThinking = toBoolean(value.clearThinking ?? value.clear_thinking);
  }

  if (value.prompts && typeof value.prompts === "object") {
    patch.prompts = sanitizePromptPatch(value.prompts);
  }
  if (value.constraints && typeof value.constraints === "object") {
    patch.constraints = sanitizeConstraintPatch(value.constraints);
  }

  return patch;
}

function sanitizePromptPatch(value) {
  const prompts = {};
  const keys = [
    "interactionSystem",
    "interactionTask",
    "turnSystem",
    "turnTask",
    "labSystem",
    "labTask",
  ];
  for (const key of keys) {
    if (typeof value[key] === "string" && value[key].trim()) {
      prompts[key] = value[key].trim().slice(0, 8000);
    }
  }
  return prompts;
}

function sanitizeConstraintPatch(value) {
  const constraints = {};

  if (value.interactionLineMaxChars !== undefined || value.interaction_line_max_chars !== undefined) {
    constraints.interactionLineMaxChars = clampInt(
      value.interactionLineMaxChars ?? value.interaction_line_max_chars,
      40,
      400
    );
  }
  if (value.interactionSummaryMaxChars !== undefined || value.interaction_summary_max_chars !== undefined) {
    constraints.interactionSummaryMaxChars = clampInt(
      value.interactionSummaryMaxChars ?? value.interaction_summary_max_chars,
      40,
      400
    );
  }
  if (value.turnLineMaxChars !== undefined || value.turn_line_max_chars !== undefined) {
    constraints.turnLineMaxChars = clampInt(value.turnLineMaxChars ?? value.turn_line_max_chars, 40, 400);
  }
  if (value.turnSummaryMaxChars !== undefined || value.turn_summary_max_chars !== undefined) {
    constraints.turnSummaryMaxChars = clampInt(value.turnSummaryMaxChars ?? value.turn_summary_max_chars, 40, 400);
  }
  if (value.turnMinCharsAfterSpeaker !== undefined || value.turn_min_chars_after_speaker !== undefined) {
    constraints.turnMinCharsAfterSpeaker = clampInt(
      value.turnMinCharsAfterSpeaker ?? value.turn_min_chars_after_speaker,
      1,
      200
    );
  }
  if (value.turnNoMarkdown !== undefined || value.turn_no_markdown !== undefined) {
    constraints.turnNoMarkdown = toBoolean(value.turnNoMarkdown ?? value.turn_no_markdown);
  }
  if (value.turnNoStageDirections !== undefined || value.turn_no_stage_directions !== undefined) {
    constraints.turnNoStageDirections = toBoolean(value.turnNoStageDirections ?? value.turn_no_stage_directions);
  }
  if (value.turnAlternateTurns !== undefined || value.turn_alternate_turns !== undefined) {
    constraints.turnAlternateTurns = toBoolean(value.turnAlternateTurns ?? value.turn_alternate_turns);
  }

  return constraints;
}

function normalizeRuntimeConstraints(input) {
  const next = {
    ...DEFAULT_CONSTRAINTS,
    ...input,
  };

  next.interactionLineMaxChars = clampInt(next.interactionLineMaxChars, 40, 400);
  next.interactionSummaryMaxChars = clampInt(next.interactionSummaryMaxChars, 40, 400);
  next.turnLineMaxChars = clampInt(next.turnLineMaxChars, 40, 400);
  next.turnSummaryMaxChars = clampInt(next.turnSummaryMaxChars, 40, 400);
  next.turnMinCharsAfterSpeaker = clampInt(next.turnMinCharsAfterSpeaker, 1, next.turnLineMaxChars - 1);
  next.turnNoMarkdown = toBoolean(next.turnNoMarkdown);
  next.turnNoStageDirections = toBoolean(next.turnNoStageDirections);
  next.turnAlternateTurns = toBoolean(next.turnAlternateTurns);
  return next;
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  return false;
}

function uniqueStrings(values) {
  const seen = new Set();
  const unique = [];
  for (const value of values || []) {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
  }
  return unique;
}

function readModelList(name, defaultList) {
  const raw = process.env[name];
  if (!raw) return uniqueStrings(defaultList);
  const parsed = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return uniqueStrings(parsed.length ? parsed : defaultList);
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
    secondaryTrait: String(value.secondaryTrait || "").trim(),
    quirk: String(value.quirk || "").trim(),
    goal: String(value.goal || "").trim(),
    communicationStyle: String(value.communicationStyle || "").trim(),
    motivation: String(value.motivation || "").trim(),
    stressBehavior: String(value.stressBehavior || "").trim(),
    personalRule: String(value.personalRule || "").trim(),
    personalitySummary: String(value.personalitySummary || "").trim(),
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

function sanitizeLabAgent(value) {
  if (!value || typeof value !== "object") return null;
  const name = String(value.name || "").trim();
  if (!name) return null;

  return {
    name: name.slice(0, 90),
    systemInstruction: String(value.systemInstruction || value.system_instruction || "")
      .trim()
      .slice(0, 4000),
    context: String(value.context || "").trim().slice(0, 1200),
  };
}

function sanitizeLabHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-24)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const line = String(entry.line || "").trim();
      const speakerName = String(entry.speakerName || entry.speaker_name || "").trim();
      if (!line || !speakerName) return null;
      return {
        speakerName: speakerName.slice(0, 90),
        line: line.slice(0, 260),
      };
    })
    .filter(Boolean);
}

function normalizeLine(value, speakerName, lineMaxChars = 180, minBodyChars = 4) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;

  const safeMax = clampInt(lineMaxChars, 24, 400);
  const safeMin = clampInt(minBodyChars, 1, Math.max(1, safeMax - 1));
  const speaker = firstName(speakerName);
  const speakerPrefix = `${speaker}:`;
  if (cleaned.toLowerCase().startsWith(speakerPrefix.toLowerCase())) {
    const body = cleaned.slice(speakerPrefix.length).trim().replace(/^["']|["']$/g, "");
    if (body.length < safeMin) return null;
    return `${speakerPrefix} "${body.slice(0, safeMax)}"`;
  }
  return `${speaker}: "${cleaned.slice(0, safeMax)}"`;
}

function normalizeSummary(value, maxChars = 220) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  const safeMax = clampInt(maxChars, 24, 400);
  return cleaned ? cleaned.slice(0, safeMax) : null;
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
    const followUps = [
      `${speakerFirst}: "That is useful, ${listenerFirst}. I can narrow this to one concrete next step."`,
      `${speakerFirst}: "Good point. I will adjust the plan and keep the scope realistic."`,
      `${speakerFirst}: "I hear you. Let me rewrite this so it is easier to execute."`,
      `${speakerFirst}: "That helps. I can tweak the sequence and report back after a quick test."`,
    ];
    return {
      line: followUps[turnIndex % followUps.length],
      shouldEnd,
      summary,
    };
  }

  return { line, shouldEnd, summary };
}

function localLabTurnFallback({ speaker, listener, turnIndex, maxTurns, allowEnd }) {
  const speakerFirst = firstName(speaker.name);
  const listenerFirst = firstName(listener.name);
  const lines = [
    `${speakerFirst}: "I want to keep this simple and concrete so we can evaluate it quickly."`,
    `${speakerFirst}: "I heard your point, ${listenerFirst}. I can adjust the next step and keep scope tight."`,
    `${speakerFirst}: "Let us run one small test and compare results after that."`,
    `${speakerFirst}: "I can summarize the plan in one sentence and remove ambiguity."`,
  ];
  const shouldEnd = turnIndex + 1 >= maxTurns || (allowEnd && turnIndex >= 3 && Math.random() < 0.35);
  return {
    line: lines[turnIndex % lines.length],
    shouldEnd,
    summary: `${speaker.name} and ${listener.name} are testing a simple conversation flow.`,
  };
}
