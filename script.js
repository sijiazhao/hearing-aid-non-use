// Questionnaire state
const state = {
  currentSection: 0,
  hasHearingAids: null,
  wearFrequency: null,
};

// Section configuration: [sectionId, shouldShow function]
// Ownership values: "yes-daily", "yes-not-often", "yes-not-wearing", "no"
const hasAids = () => state.hasHearingAids && state.hasHearingAids.startsWith("yes");
const needsReasons = () => state.hasHearingAids === "yes-not-wearing";

const sections = [
  { id: "section-welcome", show: () => true },
  { id: "section-about", show: () => true },
  { id: "section-ownership", show: () => true },
  { id: "section-usage", show: () => hasAids() && state.hasHearingAids !== "yes-not-wearing" },
  { id: "section-reasons", show: () => needsReasons() },
  { id: "section-comments", show: () => hasAids() },
  { id: "section-thankyou", show: () => true },
];

function getVisibleSections() {
  return sections.filter((s) => s.show());
}

function getCurrentVisibleIndex() {
  const visible = getVisibleSections();
  const currentId = sections[state.currentSection].id;
  return visible.findIndex((s) => s.id === currentId);
}

function updateProgress() {
  const visible = getVisibleSections();
  const currentVisibleIdx = getCurrentVisibleIndex();
  const totalSteps = visible.length - 1; // Exclude thank you
  const progress = Math.min((currentVisibleIdx / totalSteps) * 100, 100);

  const fill = document.getElementById("progressFill");
  const text = document.getElementById("progressText");
  fill.style.width = progress + "%";

  if (currentVisibleIdx < totalSteps) {
    text.textContent = `Section ${currentVisibleIdx + 1} of ${totalSteps}`;
  } else {
    text.textContent = "Complete";
  }
}

function showSection(index) {
  document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
  const section = document.getElementById(sections[index].id);
  section.classList.add("active");
  section.scrollIntoView({ behavior: "smooth", block: "start" });
  state.currentSection = index;
  updateProgress();
}

function nextSection() {
  const visible = getVisibleSections();
  const currentId = sections[state.currentSection].id;
  const currentVisibleIdx = visible.findIndex((s) => s.id === currentId);

  if (currentVisibleIdx < visible.length - 1) {
    const nextId = visible[currentVisibleIdx + 1].id;
    const nextGlobalIdx = sections.findIndex((s) => s.id === nextId);
    showSection(nextGlobalIdx);
  }
}

function prevSection() {
  const visible = getVisibleSections();
  const currentId = sections[state.currentSection].id;
  const currentVisibleIdx = visible.findIndex((s) => s.id === currentId);

  if (currentVisibleIdx > 0) {
    const prevId = visible[currentVisibleIdx - 1].id;
    const prevGlobalIdx = sections.findIndex((s) => s.id === prevId);
    showSection(prevGlobalIdx);
  }
}

// Ownership change handler
function handleOwnershipChange(value) {
  state.hasHearingAids = value;
  const ownsAids = value.startsWith("yes");
  document.getElementById("q-how-long").style.display = ownsAids ? "block" : "none";
  document.getElementById("q-type").style.display = ownsAids ? "block" : "none";
  document.getElementById("q-how-many").style.display = ownsAids ? "block" : "none";
  document.getElementById("no-aids-message").style.display = ownsAids ? "none" : "block";

  const ownershipNext = document.getElementById("ownership-next");
  if (!ownsAids) {
    // No hearing aids — jump to thank you
    ownershipNext.textContent = "Finish";
    ownershipNext.onclick = function () {
      const thankYouIdx = sections.findIndex((s) => s.id === "section-thankyou");
      showSection(thankYouIdx);
    };
  } else {
    ownershipNext.textContent = "Next";
    ownershipNext.onclick = function () {
      nextSection();
    };
  }
}

// Frequency change handler
function handleFrequencyChange(value) {
  state.wearFrequency = value;
  const showSituations = value !== "never";
  document.getElementById("q-situations").style.display = showSituations ? "block" : "none";
}

// Toggle other reason text field
function toggleOtherReason() {
  const checkbox = document.getElementById("reason-other-checkbox");
  const textarea = document.getElementById("reason-other-text");
  textarea.style.display = checkbox.checked ? "block" : "none";
  if (checkbox.checked) {
    textarea.focus();
  }
}

// Monitor apathy checkboxes to show/hide follow-up
function setupApathyMonitor() {
  const reasonsSection = document.getElementById("section-reasons");
  reasonsSection.addEventListener("change", function () {
    const apathyCheckboxes = document.querySelectorAll('[data-apathy="true"]');
    const anyChecked = Array.from(apathyCheckboxes).some((cb) => cb.checked);
    document.getElementById("apathy-followup").style.display = anyChecked ? "block" : "none";
  });
}

// Collect all responses
function collectResponses() {
  const responses = {};

  // About you
  responses.ageRange = document.getElementById("age-range").value;
  responses.gender = document.getElementById("gender").value;

  // Ownership
  responses.hasHearingAids = getRadioValue("has-hearing-aids");
  responses.howLong = document.getElementById("how-long").value;
  responses.aidType = getRadioValue("aid-type");
  responses.howMany = getRadioValue("how-many");

  // Usage
  responses.wearFrequency = getRadioValue("wear-frequency");
  responses.situations = getCheckboxValues("situations");

  // Reasons for non-use
  responses.reasons = getCheckboxValues("reasons");
  responses.reasonOtherText = document.getElementById("reason-other-text").value;
  responses.apathyImpact = getRadioValue("apathy-impact");
  responses.topReason = document.getElementById("top-reason").value;

  // Support
  responses.followUpAppt = getRadioValue("follow-up-appt");
  responses.whatWouldHelp = getCheckboxValues("what-would-help");
  responses.openComments = document.getElementById("open-comments").value;
  responses.questionnaireFeedback = document.getElementById("questionnaire-feedback").value;

  // Metadata
  responses.timestamp = new Date().toISOString();

  return responses;
}

function getRadioValue(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : null;
}

function getCheckboxValues(name) {
  const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checked).map((cb) => cb.value);
}

// Format responses for display
function formatResponses(responses) {
  const lines = [];

  lines.push("=== HEARING AID EXPERIENCE QUESTIONNAIRE ===");
  lines.push(`Date: ${new Date(responses.timestamp).toLocaleDateString()}`);
  lines.push("");

  lines.push("--- About You ---");
  lines.push(`Age range: ${responses.ageRange || "Not provided"}`);
  lines.push(`Gender: ${responses.gender || "Not provided"}`);
  lines.push("");

  lines.push("--- Hearing Aids ---");
  lines.push(`Has hearing aids: ${responses.hasHearingAids || "Not provided"}`);
  if (responses.hasHearingAids && responses.hasHearingAids.startsWith("yes")) {
    lines.push(`How long: ${responses.howLong || "Not provided"}`);
    lines.push(`Type: ${responses.aidType || "Not provided"}`);
    lines.push(`How many: ${responses.howMany || "Not provided"}`);
  }
  lines.push("");

  if (responses.wearFrequency) {
    lines.push("--- Usage ---");
    lines.push(`Wear frequency: ${responses.wearFrequency}`);
    if (responses.situations.length > 0) {
      lines.push(`Situations: ${responses.situations.join(", ")}`);
    }
    lines.push("");
  }

  if (responses.reasons.length > 0) {
    lines.push("--- Reasons for Non-Use ---");
    responses.reasons.forEach((r) => lines.push(`  - ${r}`));
    if (responses.reasonOtherText) {
      lines.push(`  Other: ${responses.reasonOtherText}`);
    }
    if (responses.apathyImpact) {
      lines.push(`Motivation/energy impact: ${responses.apathyImpact}/5`);
    }
    if (responses.topReason) {
      lines.push(`Top reason: ${responses.topReason}`);
    }
    lines.push("");
  }

  if (responses.followUpAppt) {
    lines.push("--- Support ---");
    lines.push(`Follow-up appointment: ${responses.followUpAppt}`);
    if (responses.whatWouldHelp.length > 0) {
      lines.push(`What would help: ${responses.whatWouldHelp.join(", ")}`);
    }
    lines.push("");
  }

  if (responses.openComments) {
    lines.push("--- Additional Comments ---");
    lines.push(responses.openComments);
    lines.push("");
  }

  if (responses.questionnaireFeedback) {
    lines.push("--- Questionnaire Feedback ---");
    lines.push(responses.questionnaireFeedback);
    lines.push("");
  }

  return lines.join("\n");
}

// Submit questionnaire
function submitQuestionnaire() {
  const responses = collectResponses();
  const formatted = formatResponses(responses);

  document.getElementById("summary-content").textContent = formatted;
  document.getElementById("response-summary").style.display = "block";

  // Store in localStorage for download
  localStorage.setItem("haq-last-response", JSON.stringify(responses));

  // Navigate to thank you
  const thankYouIdx = sections.findIndex((s) => s.id === "section-thankyou");
  showSection(thankYouIdx);
}

// Download responses as JSON
function downloadResponses() {
  const data = localStorage.getItem("haq-last-response");
  if (!data) return;

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hearing-aid-questionnaire-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Start over
function startOver() {
  // Reset form
  document.querySelectorAll("input[type=radio]").forEach((r) => (r.checked = false));
  document.querySelectorAll("input[type=checkbox]").forEach((c) => (c.checked = false));
  document.querySelectorAll("select").forEach((s) => (s.selectedIndex = 0));
  document.querySelectorAll("textarea").forEach((t) => (t.value = ""));

  // Reset conditional elements
  document.getElementById("q-how-long").style.display = "none";
  document.getElementById("q-type").style.display = "none";
  document.getElementById("q-how-many").style.display = "none";
  document.getElementById("no-aids-message").style.display = "none";
  document.getElementById("q-situations").style.display = "none";
  document.getElementById("apathy-followup").style.display = "none";
  document.getElementById("reason-other-text").style.display = "none";
  document.getElementById("response-summary").style.display = "none";

  // Reset state
  state.currentSection = 0;
  state.hasHearingAids = null;
  state.wearFrequency = null;

  // Reset ownership next button
  const ownershipNext = document.getElementById("ownership-next");
  ownershipNext.textContent = "Next";
  ownershipNext.onclick = function () {
    nextSection();
  };

  showSection(0);
}

// Initialise
document.addEventListener("DOMContentLoaded", function () {
  setupApathyMonitor();
  updateProgress();
});
