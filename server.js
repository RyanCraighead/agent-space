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
  maxCompletionTokens: readNumber("CEREBRAS_MAX_COMPLETION_TOKENS", 1200),
  disableReasoning: readBool("CEREBRAS_DISABLE_REASONING", false),
  clearThinking: readBool("CEREBRAS_CLEAR_THINKING", false),
};

const apiKey = process.env.CEREBRAS_API_KEY || "";
const client = apiKey ? new Cerebras({ apiKey }) : null;

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
  });
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

  const fallback = localFallback(a, b);

  try {
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "system",
          content:
            "You write concise dialogue for simulated agents. Return only valid JSON with keys aLine, bLine, summary.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Generate one short interaction between agent A and agent B.",
            constraints: {
              aLine:
                "Start with A first name and a colon. Keep under 180 characters, plain text, no markdown.",
              bLine:
                "Start with B first name and a colon. Keep under 180 characters, plain text, no markdown.",
              summary: "One sentence under 140 characters describing what they discussed.",
            },
            agentA: a,
            agentB: b,
          }),
        },
      ],
      temperature: config.temperature,
      top_p: config.topP,
      max_completion_tokens: config.maxCompletionTokens,
      disable_reasoning: config.disableReasoning,
      clear_thinking: config.clearThinking,
    });

    const message = completion?.choices?.[0]?.message;
    const text = [message?.content, message?.reasoning].filter(Boolean).join("\n");
    const parsed = parseJsonLoose(text);
    if (!parsed) {
      res.json(fallback);
      return;
    }

    const aLine = normalizeLine(parsed.aLine, a.name);
    const bLine = normalizeLine(parsed.bLine, b.name);
    const summary = normalizeSummary(parsed.summary);
    if (!aLine || !bLine || !summary) {
      res.json(fallback);
      return;
    }

    res.json({
      aLine,
      bLine,
      summary,
    });
  } catch (error) {
    console.error("Cerebras interaction request failed:", error?.message || error);
    res.json(fallback);
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
    ].join(" | ")
  );
});

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

function parseJsonLoose(input) {
  const text = String(input || "").trim();
  if (!text) return null;

  const candidates = [text];
  const blockPattern = /```(?:json)?\s*([\s\S]*?)```/gi;
  for (const match of text.matchAll(blockPattern)) {
    if (match[1]) candidates.push(match[1].trim());
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isValidInteractionObject(parsed)) return parsed;
    } catch {
      // Ignore and continue.
    }

    const objectPattern = /\{[\s\S]*?\}/g;
    for (const objectMatch of candidate.matchAll(objectPattern)) {
      const chunk = objectMatch[0];
      try {
        const parsed = JSON.parse(chunk);
        if (isValidInteractionObject(parsed)) return parsed;
      } catch {
        // Ignore and continue.
      }
    }
  }

  return null;
}

function isValidInteractionObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.aLine === "string" &&
      typeof value.bLine === "string" &&
      typeof value.summary === "string"
  );
}

function normalizeLine(value, speakerName) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;

  const first = firstName(speakerName);
  if (cleaned.toLowerCase().startsWith(`${first.toLowerCase()}:`)) {
    return cleaned.slice(0, 200);
  }
  return `${first}: "${cleaned.slice(0, 180)}"`;
}

function normalizeSummary(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, 200) : null;
}

function localFallback(a, b) {
  const aFirst = firstName(a.name);
  const bFirst = firstName(b.name);
  return {
    aLine: `${aFirst}: "I keep circling back to ${a.goal || "what works for people day-to-day"}."`,
    bLine: `${bFirst}: "Same here. ${b.quirk || "My routine"} helps when plans get noisy."`,
    summary: `${a.name} and ${b.name} compared ideas about neighborhood routines.`,
  };
}
