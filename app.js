/* =================================================================
   Conversational Framework Lesson Designer — app.js
   ================================================================= */

// CF type → colour class mapping
const CF_COLOUR = {
  Acquisition: "blue",
  Inquiry: "blue",
  Practice: "amber",
  Production: "amber",
  Discussion: "teal",
  Collaboration: "teal",
};

function cfColour(type) {
  return CF_COLOUR[type] || "blue";
}

// --- DOM refs ---
const formSection = document.getElementById("form-section");
const loadingSection = document.getElementById("loading-section");
const errorSection = document.getElementById("error-section");
const outputSection = document.getElementById("output-section");
const outputContent = document.getElementById("output-content");
const form = document.getElementById("lesson-form");
const submitBtn = document.getElementById("submit-btn");
const errorMessage = document.getElementById("error-message");
const errorResetBtn = document.getElementById("error-reset-btn");
const resetBtn = document.getElementById("reset-btn");
const printBtn = document.getElementById("print-btn");

// --- Show/hide helpers ---
function showOnly(section) {
  [formSection, loadingSection, errorSection, outputSection].forEach((s) =>
    s.classList.add("hidden")
  );
  section.classList.remove("hidden");
}

// --- Validation ---
function validateForm() {
  const lessonField = document.getElementById("lesson");
  const lessonError = document.getElementById("lesson-error");
  const val = lessonField.value.trim();
  if (!val) {
    lessonField.classList.add("invalid");
    lessonError.classList.add("visible");
    lessonField.focus();
    return false;
  }
  lessonField.classList.remove("invalid");
  lessonError.classList.remove("visible");
  return true;
}

// --- Form submission ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    lesson: document.getElementById("lesson").value.trim(),
    subject: document.getElementById("subject").value.trim(),
    level: document.getElementById("level").value,
    mode: document.getElementById("mode").value,
    size: document.getElementById("size").value,
    resourceUrl: document.getElementById("resourceUrl").value.trim(),
  };

  showOnly(loadingSection);
  submitBtn.disabled = true;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || `Server error ${res.status}`);
    }

    renderOutput(data, payload);
    showOnly(outputSection);
  } catch (err) {
    errorMessage.textContent = err.message || "An unexpected error occurred.";
    showOnly(errorSection);
  } finally {
    submitBtn.disabled = false;
  }
});

// --- Reset ---
function resetToForm() {
  showOnly(formSection);
  outputContent.innerHTML = "";
  form.reset();
  document.getElementById("lesson").classList.remove("invalid");
  document.getElementById("lesson-error").classList.remove("visible");
}

resetBtn.addEventListener("click", resetToForm);
errorResetBtn.addEventListener("click", resetToForm);
printBtn.addEventListener("click", () => window.print());

// --- Render output ---
function renderOutput(data, payload) {
  const html = [
    renderMetadata(payload),
    renderSummary(data.summary),
    renderCFMapping(data.cf_mapping),
    renderTasks(data.tasks),
    renderDesignTips(data.design_tips),
  ].join("");
  outputContent.innerHTML = html;
}

// 1. Metadata bar
function renderMetadata(payload) {
  const pills = [payload.subject, payload.level, payload.mode, payload.size]
    .filter(Boolean)
    .map((v) => `<span class="meta-pill">${escHtml(v)}</span>`)
    .join("");
  return `<div class="metadata-bar">${pills || '<span class="meta-pill">Lesson plan</span>'}</div>`;
}

// 2. Summary
function renderSummary(summary) {
  return `
    <div class="summary-card">
      <p class="section-label">Lesson overview</p>
      <p>${escHtml(summary)}</p>
    </div>`;
}

// 3. CF Mapping
function renderCFMapping(cfMapping) {
  const primary = (cfMapping || []).filter((c) => c.priority === "primary");
  const secondary = (cfMapping || []).filter((c) => c.priority !== "primary");

  const makeCards = (items) => {
    if (!items.length) return "";
    return `<div class="cf-cards-grid">
      ${items
        .map(
          (c) => `
        <div class="cf-type-card cf-${cfColour(c.type)}">
          <h4>${escHtml(c.type)}</h4>
          <p>${escHtml(c.relevance)}</p>
        </div>`
        )
        .join("")}
    </div>`;
  };

  const flowNodes = [
    "Teacher sets context",
    "Acquisition",
    "Practice / feedback",
    "Discussion",
    "Production",
  ];
  const flowHtml = flowNodes
    .map((n, i) => {
      const node = `<span class="flow-node">${escHtml(n)}</span>`;
      return i < flowNodes.length - 1
        ? node + `<span class="flow-arrow">→</span>`
        : node;
    })
    .join("");

  return `
    <div class="cf-mapping-card">
      <p class="section-label">Conversational Framework mapping</p>
      ${primary.length ? `<p class="cf-group-label">Primary learning types</p>${makeCards(primary)}` : ""}
      ${secondary.length ? `<p class="cf-group-label">Supporting learning types</p>${makeCards(secondary)}` : ""}
      <div class="flow-diagram">${flowHtml}</div>
    </div>`;
}

// 4. Activity suggestions
function renderTasks(tasks) {
  if (!tasks || !tasks.length) return "";

  const taskHtml = tasks
    .map((task) => {
      const cfTypePills = (task.cf_types || [])
        .map(
          (t) =>
            `<span class="pill pill-${cfColour(t)}">${escHtml(t)}</span>`
        )
        .join("");

      const principlePills = (task.cf_principles || [])
        .map(
          (p) => `<span class="pill pill-purple">${escHtml(p)}</span>`
        )
        .join("");

      const toolPill = task.tool_url
        ? `<a class="pill pill-tool" href="${escAttr(task.tool_url)}" target="_blank" rel="noopener noreferrer">${escHtml(task.digital_tool)}</a>`
        : `<span class="pill pill-tool">${escHtml(task.digital_tool)}</span>`;

      return `
        <div class="task-block">
          <div class="task-header">
            <span class="task-title">${escHtml(task.title)}</span>
            <span class="task-duration">${escHtml(task.duration)}</span>
          </div>
          <div class="task-tags">
            ${cfTypePills}
            ${principlePills}
            ${toolPill}
          </div>
          <p class="task-description">${escHtml(task.description)}</p>
          <div class="task-rationale">${escHtml(task.tool_rationale)}</div>
        </div>`;
    })
    .join("");

  return `
    <div class="tasks-card">
      <p class="section-label">Activity suggestions</p>
      ${taskHtml}
    </div>`;
}

// 5. Design tips
function renderDesignTips(tips) {
  if (!tips) return "";
  return `
    <div class="tips-card">
      <p class="section-label">Design tips</p>
      <p>${escHtml(tips)}</p>
    </div>`;
}

// --- Escape helpers ---
function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escAttr(str) {
  if (!str) return "#";
  // Only allow http/https URLs
  const trimmed = String(str).trim();
  if (!/^https?:\/\//i.test(trimmed)) return "#";
  return trimmed
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}
