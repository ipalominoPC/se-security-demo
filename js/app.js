// Entry point for the SMB Security Posture Assessment (Demo 1).
// Depends on: QUESTIONS, ANSWER_OPTIONS (data/questions.js), scoreAssessment (js/scoring.js),
// buildReport, renderReport, downloadReport, SAMPLE_ANSWERS (js/report.js).
// Fictional data only.

const state = {
  view: "landing", // "landing" | "question" | "report"
  domainIndex: 0,
  answers: {},
  report: null,
  whatIfFixes: [],
  renderedScore: null,
  expandedDomains: [],
  consoleSection: "overview",
  findingFilter: "all",
  selectedFindingId: null,
};

function appRoot() {
  return document.getElementById("app");
}

function showLanding() {
  state.view = "landing";
  state.answers = {};
  state.report = null;
  state.whatIfFixes = [];
  state.renderedScore = null;
  state.expandedDomains = [];
  state.consoleSection = "overview";
  state.findingFilter = "all";
  state.selectedFindingId = null;
  state.consoleSection = "overview";
  state.findingFilter = "all";
  state.selectedFindingId = null;
  const sample = buildReport(SAMPLE_ANSWERS, { isSample: true });
  const biggest = sample.lead.biggestPain;
  const focusAreas = sample.topFindings.slice(0, 3).map((finding) => `<li><span class="landing-dot"></span><span>${escapeHtml(finding.title)}</span></li>`).join("");
  appRoot().innerHTML = `<section id="landing-view" class="landing-shell">
    <header class="landing-nav"><div class="landing-brand"><img src="assets/isaac-palomino-wordmark-light.png" alt="Isaac Palomino"><span>MERIDIAN SECURITY CONSOLE</span></div><span class="landing-demo-tag">DEMO 01 · EXECUTIVE VIEW</span></header>
    <div class="landing-grid"><div class="landing-copy"><p class="landing-kicker">Security posture, made actionable</p><h1>Find the risk.<br><em>Show the next move.</em></h1><p class="landing-subtitle">A 90-second assessment that turns scattered security answers into a clear priority, a defensible value story, and a plan a leadership team can act on.</p><div class="landing-actions"><button id="start-btn" type="button" class="landing-primary">Run the live assessment <span>↗</span></button><button type="button" data-view-sample class="landing-secondary">Explore sample report</button></div><p class="landing-note"><span class="landing-pulse"></span>No login · fictional Meridian data · built for a guided demo</p></div>
      <div class="landing-preview"><div class="preview-topline"><span>MERIDIAN LOGISTICS GROUP</span><span class="preview-status"><i></i> SAMPLE REPORT</span></div><div class="preview-score"><div><p>OVERALL POSTURE</p><strong>${sample.overallScore}</strong><span>/ 100</span></div><div class="preview-rating">${RATING_LABEL[sample.overallRating].toUpperCase()}<small>Current exposure</small></div></div><div class="preview-divider"></div><div class="preview-alert"><span class="preview-alert-icon">!</span><div><p>BIGGEST PAIN</p><strong>${escapeHtml(biggest.pain)}</strong><span>${escapeHtml(biggest.title)}</span></div></div><div class="preview-footer"><span>Top priorities</span><ul>${focusAreas}</ul></div></div></div>
    <div class="landing-proof"><div><strong>01</strong><span>Diagnose the exposure</span></div><div><strong>02</strong><span>Make the cost tangible</span></div><div><strong>03</strong><span>Leave with a 30/60/90 plan</span></div></div>
  </section>`;
}

function answersWithWhatIfFixes(baseAnswers) {
  const answers = { ...baseAnswers };
  state.whatIfFixes.forEach((questionId) => {
    answers[questionId] = "yes";
  });
  return answers;
}

function renderInteractiveReport(container, baseAnswers, options = {}) {
  const report = buildReport(answersWithWhatIfFixes(baseAnswers), options);
  if (!options.isSample) state.report = report;
  renderConsole(container, report, { interactive: true, fixedIds: state.whatIfFixes, expandedDomains: state.expandedDomains, activeSection: state.consoleSection, findingFilter: state.findingFilter, selectedFindingId: state.selectedFindingId, downloadId: options.isSample ? "download-sample-btn" : "download-btn", showAssessment: state.view !== "report" });
  animateScore(state.renderedScore, report.overallScore);
  state.renderedScore = report.overallScore;
}

function animateScore(previousScore, nextScore) {
  const values = [...document.querySelectorAll("[data-score-value]")];
  const arcs = [...document.querySelectorAll("[data-score-gauge]")];
  if (!values.length || previousScore === null || previousScore === nextScore) return;
  const start = Number(previousScore);
  const end = Number(nextScore);
  const duration = 500;
  const startedAt = performance.now();
  const circumference = 2 * Math.PI * 52;
  const frame = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * eased);
    values.forEach((value) => { value.textContent = current; });
    arcs.forEach((arc) => { arc.style.strokeDashoffset = String(circumference - (current / 100) * circumference); });
    if (progress < 1) requestAnimationFrame(frame);
  };
  values.forEach((value) => value.classList.add("score-animating"));
  requestAnimationFrame(frame);
}

function downloadButtonHtml(id) {
  return `<div class="mt-6"><button id="${id}" type="button" class="inline-flex items-center rounded-xl bg-navy px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300/50 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300">Download report</button></div>`;
}

function showQuestion() {
  state.view = "question";
  const domain = QUESTIONS[state.domainIndex];
  const total = QUESTIONS.length;
  const questionsHtml = domain.questions
    .map((q, index) => {
      const current = state.answers[q.id];
      const options = ANSWER_OPTIONS.map(
        (o) => `<label class="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-amber hover:bg-amber/10 has-[:checked]:border-navy has-[:checked]:bg-slate-100 has-[:checked]:text-navy"><input class="h-4 w-4 accent-navy" type="radio" name="${q.id}" value="${o.value}" ${current === o.value ? "checked" : ""}>${o.label}</label>`
      ).join("");
      return `<fieldset class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <legend class="mb-4 flex gap-3 text-base font-bold leading-6 text-navy"><span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">${index + 1}</span><span>${escapeHtml(q.text)}</span></legend>
          <div class="grid gap-2 sm:grid-cols-3">${options}</div>
        </fieldset>`;
    })
    .join("");

  const isFirst = state.domainIndex === 0;
  const isLast = state.domainIndex === total - 1;
  const progress = QUESTIONS.map((item, index) => `<div class="flex items-center gap-2 ${index <= state.domainIndex ? 'text-navy' : 'text-slate-400'}"><span class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index < state.domainIndex ? 'bg-navy text-white' : index === state.domainIndex ? 'bg-amber text-navy ring-4 ring-amber/20' : 'bg-slate-200'}">${index + 1}</span><span class="hidden text-xs font-semibold sm:block">${escapeHtml(item.domain)}</span></div>`).join('<span class="hidden h-px flex-1 bg-slate-200 sm:block"></span>');
  appRoot().innerHTML = `
    <div class="grid min-h-[760px] overflow-hidden rounded-2xl border border-slate-300 bg-slate-50 shadow-xl shadow-slate-300/30 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="bg-ink p-4 text-white lg:p-5"><div class="mb-8"><div class="mb-3 rounded-xl bg-white px-3 py-2"><img src="assets/isaac-palomino-wordmark.png" alt="Isaac Palomino" class="block h-auto w-full max-w-[170px] object-contain"></div><div><strong class="block text-sm">Meridian</strong><span class="text-[10px] font-bold tracking-widest text-slate-400">SECURITY CONSOLE</span></div></div><p class="mb-3 px-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Run assessment</p><div class="rounded-xl bg-slate-700/70 px-3 py-3 text-sm font-bold text-white">12 questions<br><span class="text-xs font-normal text-slate-300">Domain ${state.domainIndex + 1} of ${total}</span></div><button id="cancel-btn" type="button" class="mt-4 w-full rounded-xl border border-slate-600 px-3 py-2 text-left text-sm font-semibold text-slate-300 transition hover:border-white hover:text-white">Exit assessment</button></aside>
      <main class="min-w-0"><header class="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8"><div><p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Meridian Security Console</p><p class="mt-1 text-sm font-semibold text-navy">Assessment in progress</p></div><span class="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">Domain ${state.domainIndex + 1} of ${total}</span></header><section class="p-5 sm:p-8">
    <div class="mb-8 flex items-center gap-2 sm:gap-3">${progress}</div>
    <div class="mb-6"><h1 class="text-3xl font-bold tracking-tight text-navy sm:text-4xl">${escapeHtml(domain.domain)}</h1><p class="mt-2 text-sm text-slate-500">Choose the answer that best reflects your current environment.</p></div>
    <form id="question-form">
      <div class="grid gap-4">${questionsHtml}</div>
      <p id="form-error" class="mt-4 hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">Answer every question before continuing.</p>
      <div class="mt-7 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
        <button id="back-btn" class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-navy hover:text-navy disabled:cursor-not-allowed disabled:opacity-40" type="button" ${isFirst ? "disabled" : ""}>Back</button>
        <button id="next-btn" class="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300/50 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300" type="submit">${isLast ? "See my report" : "Next"}</button>
      </div>
    </form></section></main></div>
  `;
}

// Saves the radio answers on the current screen. Returns false if any is missing.
function captureCurrentAnswers() {
  const domain = QUESTIONS[state.domainIndex];
  let complete = true;
  domain.questions.forEach((q) => {
    const checked = document.querySelector(`input[name="${q.id}"]:checked`);
    if (checked) {
      state.answers[q.id] = checked.value;
    } else {
      complete = false;
    }
  });
  return complete;
}

function showReport() {
  state.view = "report";
  state.whatIfFixes = [];
  state.renderedScore = null;
  state.expandedDomains = [];
  appRoot().innerHTML = `
    <div id="report-view"></div>
    <div class="mt-3"><button id="restart-btn" type="button" class="text-sm font-semibold text-slate-500 underline-offset-4 hover:text-navy hover:underline">Start over</button>
    </div>
  `;
  renderInteractiveReport(document.getElementById("report-view"), state.answers);
}

function handleClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.id === "start-btn") {
    state.domainIndex = 0;
    showQuestion();
  } else if (target.dataset.viewSample !== undefined) {
    state.view = "landing";
    state.consoleSection = "overview";
    appRoot().innerHTML = `<div id="report-view" class="w-full"></div>`;
    renderInteractiveReport(document.getElementById("report-view"), SAMPLE_ANSWERS, { isSample: true });
  } else if (target.id === "download-sample-btn") {
    downloadPdf(buildReport(answersWithWhatIfFixes(SAMPLE_ANSWERS), { isSample: true })).then(showDownloadConfirmation);
  } else if (target.id === "download-btn") {
    downloadPdf(state.report).then(showDownloadConfirmation);
  } else if (target.dataset.consoleNav) {
    state.consoleSection = target.dataset.consoleNav;
    const reportView = document.getElementById("report-view");
    const baseAnswers = state.view === "landing" ? SAMPLE_ANSWERS : state.answers;
    if (reportView) renderInteractiveReport(reportView, baseAnswers, { isSample: state.view === "landing" });
  } else if (target.dataset.findingFilter) {
    state.findingFilter = target.dataset.findingFilter;
    state.consoleSection = "findings";
    const reportView = document.getElementById("report-view");
    const baseAnswers = state.view === "landing" ? SAMPLE_ANSWERS : state.answers;
    if (reportView) renderInteractiveReport(reportView, baseAnswers, { isSample: state.view === "landing" });
  } else if (target.closest && target.closest("[data-finding-open]")) {
    const findingRow = target.closest("[data-finding-open]");
    state.selectedFindingId = findingRow.dataset.findingOpen;
    state.consoleSection = "findings";
    const reportView = document.getElementById("report-view");
    const baseAnswers = state.view === "landing" ? SAMPLE_ANSWERS : state.answers;
    if (reportView) renderInteractiveReport(reportView, baseAnswers, { isSample: state.view === "landing" });
  } else if (target.closest && target.closest("a[data-story-finding]")) {
    const link = target.closest("a[data-story-finding]");
    event.preventDefault();
    const domainId = link.dataset.storyDomain;
    const findingId = link.dataset.storyFinding;
    if (!state.expandedDomains.includes(domainId)) state.expandedDomains.push(domainId);
    state.consoleSection = "findings";
    state.selectedFindingId = findingId;
    const reportView = document.getElementById("report-view");
    const baseAnswers = state.view === "landing" ? SAMPLE_ANSWERS : state.answers;
    if (reportView) renderInteractiveReport(reportView, baseAnswers, { isSample: state.view === "landing" });
    const finding = document.getElementById(`finding-${findingId}`);
    if (finding) {
      const detail = finding.querySelector("details");
      if (detail) detail.open = true;
      if (typeof finding.scrollIntoView === "function") finding.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } else if (target.dataset.domainToggle) {
    const domainId = target.dataset.domainToggle;
    if (state.expandedDomains.includes(domainId)) {
      state.expandedDomains = state.expandedDomains.filter((id) => id !== domainId);
    } else {
      state.expandedDomains.push(domainId);
    }
    const reportView = document.getElementById("report-view");
    const baseAnswers = state.view === "landing" ? SAMPLE_ANSWERS : state.answers;
    if (reportView) renderInteractiveReport(reportView, baseAnswers, { isSample: state.view === "landing" });
  } else if (target.dataset.resetFixes) {
    state.whatIfFixes = [];
    const reportView = document.getElementById("report-view");
    const baseAnswers = state.view === "landing" ? SAMPLE_ANSWERS : state.answers;
    if (reportView) renderInteractiveReport(reportView, baseAnswers, { isSample: state.view === "landing" });
  } else if (target.dataset.fixId || target.dataset.unfixId) {
    const questionId = target.dataset.fixId || target.dataset.unfixId;
    if (target.dataset.fixId) {
      const card = target.closest("[data-finding-id]");
      if (card) {
        card.classList.add("finding-resolving");
        target.disabled = true;
        target.textContent = "Resolved ✓";
      }
      setTimeout(() => applyWhatIfToggle(questionId, true), 450);
      return;
    } else {
      applyWhatIfToggle(questionId, false);
    }
  } else if (target.id === "restart-btn" || target.id === "cancel-btn") {
    showLanding();
  } else if (target.id === "back-btn") {
    captureCurrentAnswers();
    state.domainIndex = Math.max(0, state.domainIndex - 1);
    showQuestion();
  }
}

function showDownloadConfirmation() {
  const notice = document.getElementById("download-confirmation");
  if (!notice) return;
  notice.hidden = false;
  setTimeout(() => { notice.hidden = true; }, 2600);
}

function handleChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.dataset.planCheck !== "true") return;
  const checks = [...document.querySelectorAll('[data-plan-check="true"]')];
  const complete = checks.filter((input) => input.checked).length;
  const progress = document.querySelector("[data-plan-progress]");
  const label = document.querySelector("[data-plan-progress-label]");
  if (progress) progress.style.width = `${checks.length ? (complete / checks.length) * 100 : 0}%`;
  if (label) label.textContent = `${complete} of ${checks.length} complete`;
}

function applyWhatIfToggle(questionId, shouldFix) {
  if (shouldFix) {
      if (!state.whatIfFixes.includes(questionId)) state.whatIfFixes.push(questionId);
  } else {
    state.whatIfFixes = state.whatIfFixes.filter((id) => id !== questionId);
  }
  const reportView = document.getElementById("report-view");
  const baseAnswers = state.view === "landing" ? SAMPLE_ANSWERS : state.answers;
  if (reportView) renderInteractiveReport(reportView, baseAnswers, { isSample: state.view === "landing" });
}

function handleSubmit(event) {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== "question-form") return;
  event.preventDefault();
  const complete = captureCurrentAnswers();
  const error = document.getElementById("form-error");
  if (!complete) {
    error.style.display = "block";
    return;
  }
  if (state.domainIndex === QUESTIONS.length - 1) {
    showReport();
  } else {
    state.domainIndex += 1;
    showQuestion();
  }
}

function init() {
  if (!appRoot()) return;
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("submit", handleSubmit);
  showLanding();
}

document.addEventListener("DOMContentLoaded", init);
