const API_KEY_STORAGE_KEY = "agent-space.cerebrasApiKey";

const ui = {
  status: document.getElementById("lab-status"),
  openMain: document.getElementById("open-main"),
  apiKey: document.getElementById("lab-api-key"),
  runtimeForm: document.getElementById("runtime-settings-form"),
  applyRuntime: document.getElementById("apply-runtime-settings"),
  rtModel: document.getElementById("rt-model"),
  rtTemperature: document.getElementById("rt-temperature"),
  rtTopP: document.getElementById("rt-top-p"),
  rtTurnTokens: document.getElementById("rt-turn-tokens"),
  rtInteractionTokens: document.getElementById("rt-interaction-tokens"),
  rtInteractionLineMax: document.getElementById("rt-interaction-line-max"),
  rtInteractionSummaryMax: document.getElementById("rt-interaction-summary-max"),
  rtTurnLineMax: document.getElementById("rt-turn-line-max"),
  rtTurnSummaryMax: document.getElementById("rt-turn-summary-max"),
  rtTurnMinBody: document.getElementById("rt-turn-min-body"),
  rtTurnNoMarkdown: document.getElementById("rt-turn-no-markdown"),
  rtTurnNoStage: document.getElementById("rt-turn-no-stage"),
  rtTurnAlternate: document.getElementById("rt-turn-alternate"),
  rtDisableReasoning: document.getElementById("rt-disable-reasoning"),
  rtClearThinking: document.getElementById("rt-clear-thinking"),
  rtAutoApply: document.getElementById("rt-auto-apply"),
  rtTurnSystem: document.getElementById("rt-turn-system"),
  rtTurnTask: document.getElementById("rt-turn-task"),
  rtInteractionSystem: document.getElementById("rt-interaction-system"),
  rtInteractionTask: document.getElementById("rt-interaction-task"),
  rtLabSystem: document.getElementById("rt-lab-system"),
  rtLabTask: document.getElementById("rt-lab-task"),
  botAName: document.getElementById("bot-a-name"),
  botASystem: document.getElementById("bot-a-system"),
  botAContext: document.getElementById("bot-a-context"),
  botBName: document.getElementById("bot-b-name"),
  botBSystem: document.getElementById("bot-b-system"),
  botBContext: document.getElementById("bot-b-context"),
  turns: document.getElementById("lab-turns"),
  allowEnd: document.getElementById("lab-allow-end"),
  run: document.getElementById("lab-run"),
  step: document.getElementById("lab-step"),
  clear: document.getElementById("lab-clear"),
  transcript: document.getElementById("lab-transcript"),
};

const state = {
  history: [],
  autoSaveTimer: null,
  running: false,
};

init();

async function init() {
  bindUi();
  ui.apiKey.value = loadStoredApiKey();
  renderTranscript();
  await loadRuntimeSettings();
}

function bindUi() {
  ui.openMain.addEventListener("click", () => {
    window.open("./index.html", "_blank", "noopener,noreferrer");
  });

  ui.apiKey.addEventListener("input", () => {
    saveApiKey(ui.apiKey.value.trim());
  });

  ui.applyRuntime.addEventListener("click", () => {
    saveRuntimeSettings(true);
  });

  ui.runtimeForm.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", () => {
      if (!ui.rtAutoApply.checked) return;
      queueAutoSave();
    });
  });

  ui.run.addEventListener("click", () => {
    runConversation(false);
  });

  ui.step.addEventListener("click", () => {
    runConversation(true);
  });

  ui.clear.addEventListener("click", () => {
    state.history = [];
    renderTranscript();
    setStatus("Transcript cleared.");
  });
}

function queueAutoSave() {
  if (state.autoSaveTimer) {
    window.clearTimeout(state.autoSaveTimer);
  }
  state.autoSaveTimer = window.setTimeout(() => {
    saveRuntimeSettings(false);
  }, 260);
}

async function loadRuntimeSettings() {
  setStatus("Loading runtime settings...");
  try {
    const response = await fetch("/api/runtime-settings");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const settings = await response.json();
    hydrateRuntimeForm(settings);
    setStatus(`Loaded. Active model: ${settings.model}`);
  } catch (error) {
    setStatus(`Failed to load settings: ${error?.message || error}`);
  }
}

function hydrateRuntimeForm(settings) {
  ui.rtModel.value = settings.model || "";
  ui.rtTemperature.value = Number(settings.temperature ?? 1).toFixed(2);
  ui.rtTopP.value = Number(settings.topP ?? 0.95).toFixed(2);
  ui.rtTurnTokens.value = String(settings.turnMaxCompletionTokens ?? 320);
  ui.rtInteractionTokens.value = String(settings.interactionMaxCompletionTokens ?? 1200);
  ui.rtInteractionLineMax.value = String(settings.constraints?.interactionLineMaxChars ?? 180);
  ui.rtInteractionSummaryMax.value = String(settings.constraints?.interactionSummaryMaxChars ?? 140);
  ui.rtTurnLineMax.value = String(settings.constraints?.turnLineMaxChars ?? 180);
  ui.rtTurnSummaryMax.value = String(settings.constraints?.turnSummaryMaxChars ?? 220);
  ui.rtTurnMinBody.value = String(settings.constraints?.turnMinCharsAfterSpeaker ?? 18);
  ui.rtTurnNoMarkdown.checked = Boolean(settings.constraints?.turnNoMarkdown ?? true);
  ui.rtTurnNoStage.checked = Boolean(settings.constraints?.turnNoStageDirections ?? true);
  ui.rtTurnAlternate.checked = Boolean(settings.constraints?.turnAlternateTurns ?? true);
  ui.rtDisableReasoning.checked = Boolean(settings.disableReasoning);
  ui.rtClearThinking.checked = Boolean(settings.clearThinking);
  ui.rtTurnSystem.value = settings.prompts?.turnSystem || "";
  ui.rtTurnTask.value = settings.prompts?.turnTask || "";
  ui.rtInteractionSystem.value = settings.prompts?.interactionSystem || "";
  ui.rtInteractionTask.value = settings.prompts?.interactionTask || "";
  ui.rtLabSystem.value = settings.prompts?.labSystem || "";
  ui.rtLabTask.value = settings.prompts?.labTask || "";
}

function collectRuntimePayload() {
  return {
    model: ui.rtModel.value.trim(),
    temperature: Number(ui.rtTemperature.value),
    top_p: Number(ui.rtTopP.value),
    turn_max_completion_tokens: Number(ui.rtTurnTokens.value),
    interaction_max_completion_tokens: Number(ui.rtInteractionTokens.value),
    constraints: {
      interactionLineMaxChars: Number(ui.rtInteractionLineMax.value),
      interactionSummaryMaxChars: Number(ui.rtInteractionSummaryMax.value),
      turnLineMaxChars: Number(ui.rtTurnLineMax.value),
      turnSummaryMaxChars: Number(ui.rtTurnSummaryMax.value),
      turnMinCharsAfterSpeaker: Number(ui.rtTurnMinBody.value),
      turnNoMarkdown: ui.rtTurnNoMarkdown.checked,
      turnNoStageDirections: ui.rtTurnNoStage.checked,
      turnAlternateTurns: ui.rtTurnAlternate.checked,
    },
    disable_reasoning: ui.rtDisableReasoning.checked,
    clear_thinking: ui.rtClearThinking.checked,
    prompts: {
      turnSystem: ui.rtTurnSystem.value,
      turnTask: ui.rtTurnTask.value,
      interactionSystem: ui.rtInteractionSystem.value,
      interactionTask: ui.rtInteractionTask.value,
      labSystem: ui.rtLabSystem.value,
      labTask: ui.rtLabTask.value,
    },
  };
}

async function saveRuntimeSettings(manual) {
  const payload = collectRuntimePayload();
  const prefix = manual ? "Applying settings..." : "Auto applying settings...";
  setStatus(prefix);

  try {
    const response = await fetch("/api/runtime-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const updated = await response.json();
    hydrateRuntimeForm(updated);
    setStatus(`Saved. Active model: ${updated.model}`);
  } catch (error) {
    setStatus(`Failed to save settings: ${error?.message || error}`);
  }
}

async function runConversation(stepOnly) {
  if (state.running) return;
  state.running = true;
  setRunDisabled(true);

  try {
    if (!stepOnly) {
      state.history = [];
      renderTranscript();
    }

    const maxTurns = clampInt(ui.turns.value, 2, 48);
    const turnsToRun = stepOnly ? 1 : maxTurns;
    let turnsRan = 0;

    while (turnsRan < turnsToRun && state.history.length < maxTurns) {
      const speaker = state.history.length % 2 === 0 ? getBotConfig("a") : getBotConfig("b");
      const listener = state.history.length % 2 === 0 ? getBotConfig("b") : getBotConfig("a");

      const payload = {
        speaker,
        listener,
        history: state.history.map((turn) => ({
          speakerName: turn.speakerName,
          line: turn.line,
        })),
        turnIndex: state.history.length,
        maxTurns,
        allowEnd: ui.allowEnd.checked,
      };

      const headers = { "Content-Type": "application/json" };
      const apiKey = ui.apiKey.value.trim();
      if (apiKey) {
        headers["x-cerebras-api-key"] = apiKey;
      }

      const response = await fetch("/api/lab/conversation-turn", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const line = typeof data.line === "string" ? data.line.trim() : "";
      if (!line) {
        throw new Error("Empty line returned");
      }

      const speakerName = firstName(speaker.name);
      state.history.push({
        speakerName,
        line,
        summary: String(data.summary || "").trim(),
        shouldEnd: Boolean(data.shouldEnd),
      });
      turnsRan += 1;
      renderTranscript();

      if (data.shouldEnd) {
        setStatus(`Conversation ended naturally after ${state.history.length} turns.`);
        break;
      }
    }

    if (!state.history.length) {
      setStatus("No turns were generated.");
    } else if (!state.history[state.history.length - 1].shouldEnd) {
      setStatus(`Generated ${state.history.length} turns.`);
    }
  } catch (error) {
    setStatus(`Conversation run failed: ${error?.message || error}`);
  } finally {
    state.running = false;
    setRunDisabled(false);
  }
}

function getBotConfig(side) {
  if (side === "a") {
    return {
      name: ui.botAName.value.trim() || "Bot A",
      systemInstruction: ui.botASystem.value.trim(),
      context: ui.botAContext.value.trim(),
    };
  }
  return {
    name: ui.botBName.value.trim() || "Bot B",
    systemInstruction: ui.botBSystem.value.trim(),
    context: ui.botBContext.value.trim(),
  };
}

function renderTranscript() {
  if (!state.history.length) {
    ui.transcript.innerHTML = "<p class='empty'>No turns yet. Run or step to generate conversation.</p>";
    return;
  }

  ui.transcript.innerHTML = state.history
    .map((turn, idx) => {
      const summary = turn.summary ? `<div class="summary">${escapeHtml(turn.summary)}</div>` : "";
      return `
        <article class="turn">
          <div class="line"><strong>#${idx + 1}</strong> ${escapeHtml(turn.line)}</div>
          ${summary}
        </article>
      `;
    })
    .join("");
}

function setRunDisabled(disabled) {
  ui.run.disabled = disabled;
  ui.step.disabled = disabled;
  ui.clear.disabled = disabled;
}

function setStatus(message) {
  ui.status.textContent = String(message || "");
}

function firstName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)[0];
}

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function loadStoredApiKey() {
  try {
    return String(window.localStorage.getItem(API_KEY_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

function saveApiKey(key) {
  try {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, key);
  } catch {
    // Ignore storage write failures.
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
