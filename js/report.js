// Report view and download for the SMB Security Posture Assessment (Demo 1).
// Depends on: QUESTIONS (data/questions.js), FINDINGS, SEVERITY_ORDER, SEVERITY_TIER (data/findings.js),
// REMEDIATION_TIERS (data/remediation.js), IMPACT_SOURCES, TOP3_VALUE_ESTIMATE (data/impact-sources.js),
// scoreAssessment (js/scoring.js). Fictional data only: Meridian Logistics Group.

const REPORT_COMPANY = {
  name: "Meridian Logistics Group",
  employees: 120,
  endpoints: 150,
};

const BRAND_WORDMARK = "assets/isaac-palomino-wordmark.png";
const BRAND_WORDMARK_LIGHT = "assets/isaac-palomino-wordmark-light.png";

function brandLockup(width = 230, light = false) {
  return `<div style="display:inline-flex;align-items:center;${light ? "padding-bottom:5px;border-bottom:3px solid #f4b942;" : ""}"><img src="${light ? BRAND_WORDMARK_LIGHT : BRAND_WORDMARK}" alt="Isaac Palomino" style="display:block;width:${width}px;max-width:100%;height:auto;object-fit:contain;"></div>`;
}

// Sample completed answers for the landing view. Fictional.
const SAMPLE_ANSWERS = {
  "identity-mfa-1": "partly",
  "identity-mfa-2": "partly",
  "patching-endpoints-1": "yes",
  "patching-endpoints-2": "no",
  "backup-dr-2": "partly",
  "backup-dr-3": "no",
  "email-security-1": "partly",
  "email-security-4": "no",
  "network-remote-2": "partly",
  "network-remote-3": "no",
  "people-policy-2": "partly",
  "people-policy-3": "no",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Every question that is not a clean "yes" (partly, no, or unanswered) raises a finding.
// Ranked by severity, then by how weak its domain is, then by question order.
function collectRaisedFindings(scored) {
  const raised = [];
  let order = 0;
  scored.domains.forEach((domain) => {
    domain.questions.forEach((q) => {
      order += 1;
      if (q.answer === "yes") return;
      const finding = FINDINGS[q.id];
      if (!finding) return;
      raised.push({
        questionId: q.id,
        questionText: q.text,
        domain: domain.domain,
        domainId: domain.id,
        domainScore: domain.score,
        answer: q.answer,
        order,
        ...finding,
      });
    });
  });
  raised.sort(
    (a, b) =>
      SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
      a.domainScore - b.domainScore ||
      a.order - b.order
  );
  return raised;
}

function buildPlan(raised) {
  return REMEDIATION_TIERS.map((tier) => {
    const items = raised.filter((f) => SEVERITY_TIER[f.severity] === tier.days);
    return { ...tier, items };
  });
}

// Lead section: the single biggest pain (top-ranked finding) and the estimated value of fixing the top 3.
function buildLead(topFindings) {
  const biggest = topFindings[0] || null;
  return {
    biggestPain: biggest,
    biggestPainSource: biggest ? IMPACT_SOURCES[biggest.impactSource] : null,
    top3Value: topFindings.length ? TOP3_VALUE_ESTIMATE : null,
  };
}

// The breach story: four steps in attack order. Each step points to an existing finding.
// No new data: the step wording is a label; the detail is the finding's own pain line.
const STORY_STEPS = [
  { questionId: "email-security-1", step: "A phishing email gets through" },
  { questionId: "identity-mfa-1", step: "No MFA, so the stolen password works" },
  { questionId: "network-remote-2", step: "Open remote access lets the attacker in" },
  { questionId: "backup-dr-2", step: "The backup is encrypted along with the files" },
];

// Story steps in attack order. Exposed when the matching finding was raised.
function buildStory(raised) {
  return STORY_STEPS.map((s, index) => {
    const finding = raised.find((f) => f.questionId === s.questionId) || null;
    return {
      number: index + 1,
      step: s.step,
      exposed: Boolean(finding),
      pain: finding ? finding.pain : null,
      findingTitle: finding ? finding.title : null,
      questionId: s.questionId,
      domainId: finding ? finding.domainId : null,
      domain: finding ? finding.domain : null,
    };
  });
}

// Builds the full report data from answers. Pure: no DOM access.
function buildReport(answers, options = {}) {
  const scored = scoreAssessment(answers);
  const raised = collectRaisedFindings(scored);
  const topFindings = raised.slice(0, 3);
  return {
    company: REPORT_COMPANY,
    generatedAt: options.generatedAt || new Date().toISOString().slice(0, 10),
    isSample: Boolean(options.isSample),
    overallScore: scored.overallScore,
    overallRating: scored.overallRating,
    anyDomainRed: scored.anyDomainRed,
    complete: scored.complete,
    totalUnanswered: scored.totalUnanswered,
    domains: scored.domains,
    topFindings,
    lead: buildLead(topFindings),
    story: buildStory(raised),
    raisedCount: raised.length,
    plan: buildPlan(raised),
  };
}

const RATING_LABEL = { green: "Green", amber: "Amber", red: "Red" };

function ratingBadge(rating) {
  const colours = {
    green: "background:#dcfce7;color:#14532d;",
    amber: "background:#fef3c7;color:#78350f;",
    red: "background:#fee2e2;color:#7f1d1d;",
  };
  return `<span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-weight:600;${colours[rating]}">${RATING_LABEL[rating]}</span>`;
}

function severityBadge(severity) {
  const styles = {
    critical: "background:#fee2e2;color:#991b1b;border-color:#fecaca;",
    high: "background:#fef3c7;color:#92400e;border-color:#fde68a;",
    medium: "background:#e2e8f0;color:#475569;border-color:#cbd5e1;",
  };
  const labels = { critical: "Critical · Urgent", high: "High", medium: "Medium" };
  return `<span style="display:inline-flex;align-items:center;padding:4px 8px;border:1px solid;border-radius:999px;font-size:11px;font-weight:800;${styles[severity]}">${labels[severity]}</span>`;
}

function scoreGauge(report) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (report.overallScore / 100) * circumference;
  const arcColours = { green: "#16a34a", amber: "#d97706", red: "#dc2626" };
  return `<div style="display:flex;align-items:center;gap:16px;" role="img" aria-label="Overall score ${report.overallScore} out of 100, ${RATING_LABEL[report.overallRating]}">
    <div style="position:relative;width:132px;height:132px;flex:0 0 auto;">
      <svg viewBox="0 0 132 132" width="132" height="132" aria-hidden="true" style="display:block;transform:rotate(-90deg);">
        <circle cx="66" cy="66" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="12"></circle>
        <circle class="score-gauge-arc" data-score-gauge="${report.overallScore}" cx="66" cy="66" r="${radius}" fill="none" stroke="${arcColours[report.overallRating]}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
      </svg>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#172033;"><strong class="score-value" data-score-value="${report.overallScore}" style="font-size:28px;line-height:1;font-weight:800;">${report.overallScore}</strong><span style="margin-top:4px;font-size:11px;color:#64748b;">out of 100</span></div>
    </div>
    <div><p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;font-weight:800;">Overall posture</p><p style="margin:0 0 8px;font-size:16px;color:#172033;">${ratingBadge(report.overallRating)}</p><p style="margin:0;font-size:13px;color:#64748b;">Live score after the current what-if fixes.</p></div>
  </div>`;
}

function sourceLink(source) {
  if (!source) return "";
  return `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener" style="color:#1d4ed8;text-decoration:underline;text-underline-offset:2px;">${escapeHtml(source.publisher)}: ${escapeHtml(source.title)}</a>`;
}

function impactLine(finding) {
  const label = finding.impactIsEstimate ? "Estimate (context only)" : "Figure";
  const source = IMPACT_SOURCES[finding.impactSource];
  return `<p style="margin:10px 0 0;padding:10px 12px;border-left:3px solid #f4b942;background:#fffbeb;border-radius:0 8px 8px 0;font-size:14px;"><strong style="color:#172033;">${label}:</strong> ${escapeHtml(finding.impact)} <span style="display:inline-block;margin:4px 0 0;padding:3px 8px;border-radius:999px;background:#e2e8f0;color:#334155;font-size:12px;font-weight:700;">Scope: ${escapeHtml(finding.impactScope)}</span> <span style="display:block;margin-top:5px;font-size:12px;color:#475569;">Source: ${sourceLink(source)}</span></p>`;
}

function renderLeadSection(lead) {
  if (!lead.biggestPain) {
    return `<section style="margin:0 0 24px;padding:20px;border:1px solid #bbf7d0;border-radius:16px;background:#f0fdf4;">
      <h2 style="margin:0 0 6px;font-size:18px;color:#166534;">No open pain found</h2>
      <p style="margin:0;">Every question was answered yes. Keep these controls in place and re-check them each year.</p>
    </section>`;
  }
  const p = lead.biggestPain;
  const v = lead.top3Value;
  const assumptions = v.assumptions.map((a) => `<li style="margin:4px 0;">${escapeHtml(a)}</li>`).join("");
  return `<section role="alert" style="margin:0 0 24px;padding:20px;border:1px solid #fecaca;border-left:6px solid #dc2626;border-radius:16px;background:linear-gradient(135deg,#fff1f2,#fff7ed);box-shadow:0 8px 24px rgba(127,29,29,.10);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#b91c1c;font-weight:900;">Urgent · Your biggest pain</p>
      <h2 style="margin:0 0 8px;font-size:24px;line-height:1.2;color:#172033;">${escapeHtml(p.pain)}</h2>
      <p style="margin:0 0 4px;font-size:14px;color:#475569;">${severityBadge(p.severity)} <span style="margin-left:6px;">${escapeHtml(p.title)}.</span></p>
      ${impactLine(p)}
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid #fed7aa;"><p style="margin:0 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#9a3412;font-weight:800;">Top 3 value · estimate</p>
      <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#172033;">${escapeHtml(v.perPointDisplay)} for each point of breach likelihood removed</p>
      <p style="margin:0 0 6px;font-size:14px;color:#475569;">Baseline: ${escapeHtml(v.baseline.display)}, the ${escapeHtml(v.baseline.what)}. <span style="display:inline-block;margin-top:4px;padding:3px 8px;border-radius:999px;background:#e2e8f0;color:#334155;font-size:12px;font-weight:700;">Scope: ${escapeHtml(v.baseline.scope)}</span> Source: ${sourceLink(IMPACT_SOURCES[v.baseline.source])}.</p>
      <p style="margin:0 0 6px;font-size:14px;">Formula: ${escapeHtml(v.formula)}.</p>
      <p style="margin:8px 0 4px;font-size:13px;font-weight:600;">Assumptions</p>
      <ul style="margin:0 0 0 18px;padding:0;font-size:13px;color:#475569;">${assumptions}</ul></div>
    </section>`;
}

// One finding, collapsed to a one-word verdict and its pain line. Full detail sits behind a click.
function renderVerdictFinding(finding, options = {}) {
  const border = finding.severity === "critical" ? "#fecaca" : finding.severity === "high" ? "#fde68a" : "#cbd5e1";
  const background = finding.severity === "critical" ? "#fff1f2" : finding.severity === "high" ? "#fffbeb" : "#f8fafc";
  const anchor = options.anchorId ? ` id="${escapeHtml(options.anchorId)}"` : "";
  const open = options.openDetail ? " open" : "";
  const summaryLabel = options.rank ? `${options.rank}. ${finding.title}` : finding.title;
  return `<article${anchor} style="margin-top:10px;padding:14px;border-radius:12px;border:1px solid ${border};background:${background};">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
      <p style="margin:0;font-size:24px;font-weight:900;letter-spacing:.08em;color:${options.fixed ? "#166534" : "#b91c1c"};">${options.fixed ? "FIXED" : "EXPOSED"}</p>
      ${options.fixButton || ""}
    </div>
    <p style="margin:8px 0 0;color:#172033;font-size:15px;line-height:1.5;"><strong>Pain:</strong> ${escapeHtml(finding.pain)}</p>
    <details${open} style="margin-top:10px;">
      <summary style="cursor:pointer;font-size:13px;font-weight:800;color:#1d4ed8;">Show full detail: ${escapeHtml(summaryLabel)}</summary>
      <div class="story-detail-content" style="margin-top:8px;font-size:14px;color:#334155;line-height:1.5;"><div>
        <p style="margin:4px 0;"><strong>Condition:</strong> ${escapeHtml(finding.condition)}</p>
        <p style="margin:4px 0;"><strong>Criteria:</strong> ${escapeHtml(finding.criteria)}</p>
        <p style="margin:4px 0;"><strong>Risk:</strong> ${escapeHtml(finding.risk)}</p>
        <p style="margin:4px 0;"><strong>Recommendation:</strong> ${escapeHtml(finding.recommendation)}</p>
        ${impactLine(finding)}
      </div></div>
    </details>
  </article>`;
}

function renderDomainCards(report, options = {}) {
  return report.domains.map((domain) => {
    const expanded = options.interactive ? options.expandedDomains?.includes(domain.id) : true;
    const raised = domain.questions.filter((question) => question.answer !== "yes" && FINDINGS[question.id]);
    const ratingStyles = {
      green: "background:#dcfce7;color:#166534;border-color:#bbf7d0;",
      amber: "background:#fef3c7;color:#92400e;border-color:#fde68a;",
      red: "background:#fee2e2;color:#991b1b;border-color:#fecaca;",
    };
    const ratingText = domain.rating === "red" ? "Red · Urgent" : RATING_LABEL[domain.rating];
    const details = raised.length
      ? raised.map((question) => renderVerdictFinding(FINDINGS[question.id], { anchorId: `finding-${question.id}` })).join("")
      : `<p style="margin:10px 0 0;color:#166534;font-size:14px;">No open findings in this domain.</p>`;
    const toggle = options.interactive
      ? `<button type="button" data-domain-toggle="${escapeHtml(domain.id)}" aria-expanded="${expanded}" aria-controls="domain-details-${escapeHtml(domain.id)}" class="focus:outline-none focus:ring-2 focus:ring-navy" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px;border:0;background:transparent;text-align:left;cursor:pointer;"><span><strong style="display:block;font-size:16px;color:#172033;">${escapeHtml(domain.domain)}</strong><span style="display:block;margin-top:4px;color:#64748b;font-size:13px;">${raised.length} open finding(s) · Click to ${expanded ? "collapse" : "inspect"}</span></span><span style="display:inline-flex;align-items:center;gap:8px;"><span style="padding:5px 9px;border:1px solid;border-radius:999px;font-size:12px;font-weight:800;${ratingStyles[domain.rating]}">${domain.score} · ${ratingText}</span><span aria-hidden="true" style="font-size:20px;color:#64748b;">${expanded ? "−" : "+"}</span></span></button>`
      : `<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px;"><span><strong style="display:block;font-size:16px;color:#172033;">${escapeHtml(domain.domain)}</strong><span style="display:block;margin-top:4px;color:#64748b;font-size:13px;">${raised.length} open finding(s)</span></span><span style="padding:5px 9px;border:1px solid;border-radius:999px;font-size:12px;font-weight:800;${ratingStyles[domain.rating]}">${domain.score} · ${ratingText}</span></div>`;
    return `<div id="domain-card-${escapeHtml(domain.id)}" style="margin:0 0 10px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;overflow:hidden;">${toggle}<div id="domain-details-${escapeHtml(domain.id)}" ${expanded ? "" : "hidden"} style="padding:0 16px 14px;border-top:1px solid #f1f5f9;">${details}</div></div>`;
  }).join("");
}

function renderWhatIfStatus(report, options = {}) {
  if (!options.interactive || !options.fixedIds?.length) return "";
  const fixedTitles = options.fixedIds
    .map((id) => FINDINGS[id]?.title)
    .filter(Boolean)
    .map((title, index) => `<span style="display:inline-flex;align-items:center;gap:6px;margin:4px 6px 0 0;padding:5px 9px;border:1px solid #bbf7d0;border-radius:999px;background:#f0fdf4;color:#166534;font-size:12px;font-weight:700;"><span aria-hidden="true">✓</span>${escapeHtml(title)} <button type="button" data-unfix-id="${escapeHtml(options.fixedIds[index])}" class="focus:outline-none focus:ring-2 focus:ring-emerald-500" style="border:0;background:transparent;color:#166534;font:inherit;text-decoration:underline;cursor:pointer;">Undo</button></span>`)
    .join("");
  return `<div style="margin:0 0 18px;padding:12px 14px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;"><p style="margin:0;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#475569;">What-if mode · ${report.raisedCount} open finding(s)</p><button type="button" data-reset-fixes="true" style="padding:7px 10px;border:1px solid #20324a;border-radius:8px;background:#fff;color:#20324a;font-size:12px;font-weight:800;cursor:pointer;">Reset what-if fixes</button></div><p style="margin:4px 0 0;font-size:13px;color:#475569;">Fixed controls are shown as a live scenario. Your original answers are unchanged.</p><div>${fixedTitles}</div></div>`;
}

function renderStory(story) {
  const cards = story.map((item) => {
    const storyDomainId = item.domainId || QUESTIONS.find((domain) => domain.questions.some((question) => question.id === item.questionId))?.id || "";
    const border = item.exposed ? "#fecaca" : "#e2e8f0";
    const background = item.exposed ? "linear-gradient(135deg,#fff1f2,#fff7f7)" : "#f8fafc";
    const body = item.exposed
      ? `<p style="margin:8px 0 0;font-size:14px;color:#334155;line-height:1.5;"><strong style="color:#991b1b;">${escapeHtml(item.pain)}</strong></p>
         <p style="margin:10px 0 0;font-size:13px;"><a href="#finding-${escapeHtml(item.questionId)}" data-story-domain="${escapeHtml(storyDomainId)}" data-story-finding="${escapeHtml(item.questionId)}" style="color:#b91c1c;font-weight:800;text-decoration:underline;text-underline-offset:3px;">See finding: ${escapeHtml(item.findingTitle)}</a></p>`
      : `<p style="margin:8px 0 0;font-size:14px;color:#475569;">Not exposed in this assessment.</p>`;
    const progressColour = ["#dc2626", "#ea580c", "#d97706", "#64748b"][item.number - 1];
    return `<article class="story-step" style="display:grid;grid-template-columns:40px minmax(0,1fr);gap:12px;align-items:start;padding:14px 16px 14px 8px;border:1px solid ${border};border-left:4px solid ${progressColour};border-radius:14px;background:${background};">
      <span class="story-step-node" style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;margin-top:2px;border-radius:999px;background:${item.exposed ? "#dc2626" : "#64748b"};color:#fff;font-size:13px;font-weight:900;box-shadow:0 0 0 4px ${item.exposed ? "#fee2e2" : "#e2e8f0"};">${item.number}</span>
      <div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;"><p style="margin:0;font-size:11px;font-weight:900;letter-spacing:.12em;color:${item.exposed ? "#b91c1c" : "#64748b"};">${item.exposed ? "EXPOSED" : "STEP COMPLETE"}</p><span style="padding:4px 8px;border-radius:999px;background:${item.exposed ? "#fee2e2" : "#f1f5f9"};color:${item.exposed ? "#991b1b" : "#475569"};font-size:11px;font-weight:900;">STEP ${item.number} OF 4</span></div>
      <h3 style="margin:6px 0 0;font-size:17px;line-height:1.3;color:#172033;">${escapeHtml(item.step)}</h3>
      ${body}</div>
    </article>`;
  }).join("");
  return `<section style="margin:0 0 24px;padding:18px 18px 20px;border:1px solid #fecaca;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(127,29,29,.06);">
    <p style="margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#9a3412;">How Meridian gets breached</p>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;">The attack path, built from this assessment's findings in the order an attacker uses them.</p>
    <div class="breach-timeline" style="display:grid;gap:12px;">${cards}</div>
  </section>`;
}

// Returns an HTML fragment for the report body. Plain markup, no Tailwind classes.
function renderReportBody(report, options = {}) {
  const sampleNote = report.isSample
    ? `<p style="margin:0 0 16px;font-size:14px;color:#555;">Sample completed report. Fictional company and data.</p>`
    : "";
  const incompleteNote = report.complete
    ? ""
    : `<p style="margin:0 0 16px;font-size:14px;color:#7f1d1d;">Incomplete: ${report.totalUnanswered} question(s) not answered and scored as no.</p>`;
  const capNote = report.anyDomainRed && report.overallRating !== "red"
    ? `<p style="margin:4px 0 0;font-size:13px;color:#555;">Overall rating is capped at amber because at least one domain is red.</p>`
    : "";

  const topFindings = report.topFindings.length
    ? report.topFindings
        .map((f, i) => {
          const fixButton = options.interactive
            ? `<button type="button" data-fix-id="${escapeHtml(f.questionId)}" class="focus:outline-none focus:ring-2 focus:ring-emerald-500" style="flex:0 0 auto;border:1px solid #166534;border-radius:999px;background:#f0fdf4;color:#166534;padding:7px 11px;font-size:12px;font-weight:800;cursor:pointer;">Fix this</button>`
            : "";
          return `<div class="finding-card" data-finding-id="${escapeHtml(f.questionId)}" style="margin:0 0 16px;">${renderVerdictFinding(f, { fixButton, rank: i + 1 })}</div>`;
        })
        .join("")
    : `<p>No findings were raised. Every question was answered yes.</p>`;

  const planSections = report.plan
    .map((tier) => {
      const items = tier.items.length
        ? `<ul style="margin:6px 0 0 18px;padding:0;">${tier.items
            .map((f) => `<li style="margin:4px 0;">${escapeHtml(f.title)} (${escapeHtml(f.severity)})</li>`)
            .join("")}</ul>`
        : `<p style="margin:6px 0 0;color:#555;">No actions due in this tier.</p>`;
      return `<div style="margin:0 0 16px;">
        <h3 style="margin:0 0 4px;font-size:16px;">${escapeHtml(tier.label)}</h3>
        <p style="margin:0;color:#555;">${escapeHtml(tier.summary)}</p>
        ${items}
      </div>`;
    })
    .join("");

  return `
    <header style="margin:0 0 16px;">
      <h1 style="margin:0;font-size:24px;">SMB Security Posture Assessment</h1>
      <p style="margin:4px 0 0;color:#555;">${escapeHtml(report.company.name)} · ${report.company.employees} people · ~${report.company.endpoints} endpoints · Generated ${escapeHtml(report.generatedAt)}</p>
      ${sampleNote}
    </header>
    ${renderWhatIfStatus(report, options)}
    ${renderStory(report.story)}
    ${renderLeadSection(report.lead)}
    <section style="margin:0 0 24px;padding:18px 20px;border:1px solid #e2e8f0;border-radius:16px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.06);">
      <h2 style="margin:0 0 14px;font-size:18px;">Overall score</h2>
      ${scoreGauge(report)}
      ${capNote}
      ${incompleteNote}
    </section>
    <section style="margin:0 0 24px;">
      <h2 style="margin:0 0 8px;font-size:18px;">Domain scores</h2>
      <p style="margin:0 0 10px;color:#64748b;font-size:13px;">Select a domain to inspect its open findings.</p>
      ${renderDomainCards(report, options)}
    </section>
    <section style="margin:0 0 24px;">
      <h2 style="margin:0 0 8px;font-size:18px;">Top 3 findings</h2>
      ${topFindings}
    </section>
    <section style="margin:0 0 24px;">
      <h2 style="margin:0 0 8px;font-size:18px;">30/60/90-day remediation plan</h2>
      <p style="margin:0 0 12px;font-size:14px;color:#555;">${report.raisedCount} finding(s) raised in total.</p>
      ${planSections}
    </section>
    <footer style="margin:24px 0 0;font-size:12px;color:#777;">Fictional demo data. Figures come from the named public sources linked above and are not a measured result for any company.</footer>
  `;
}

// Full standalone HTML document for download. Inline styles only, so it works offline.
function renderReportDocument(report) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SMB Security Posture Assessment | ${escapeHtml(report.company.name)}</title>
</head>
<body style="margin:0;padding:24px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#172033;background:#f5f7fa;">
<main style="max-width:860px;margin:0 auto;">
<div style="margin:0 0 18px;padding:16px 18px;border-radius:16px;background:#172033;"><p style="margin:0;color:#f4b942;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">Meridian Security Console</p></div>
${renderReportBody(report)}
</main>
</body>
</html>`;
}

// Renders the report body into a container element on the page.
function renderReport(container, report, options = {}) {
  container.innerHTML = renderReportBody(report, options);
}

function renderConsolePlan(report) {
  const total = report.plan.reduce((count, tier) => count + tier.items.length, 0);
  return report.plan.map((tier) => {
    const items = tier.items.length
      ? `<ul style="display:grid;gap:10px;margin:12px 0 0;padding:0;list-style:none;color:#334155;">${tier.items.map((f) => `<li><label style="display:flex;align-items:flex-start;gap:10px;font-size:15px;line-height:1.4;"><input type="checkbox" data-plan-check="true" style="margin-top:4px;width:16px;height:16px;accent-color:#20324a;"><span>${escapeHtml(f.title)} <span style="color:#475569;">(${escapeHtml(f.severity)})</span></span></label></li>`).join("")}</ul>`
      : `<p style="margin:10px 0 0;color:#475569;">No actions due in this tier.</p>`;
    return `<article style="margin:0 0 12px;padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;"><h3 style="margin:0;font-size:18px;line-height:1.2;color:#172033;">${escapeHtml(tier.label)}</h3><p style="margin:6px 0 0;color:#475569;font-size:14px;line-height:1.5;">${escapeHtml(tier.summary)}</p>${items}</article>`;
  }).join("") + `<div data-plan-progress-wrap="true" style="margin:0 0 16px;padding:14px 16px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;"><div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;font-weight:800;color:#334155;"><span>Plan progress</span><span data-plan-progress-label="true">0 of ${total} complete</span></div><div style="height:8px;margin-top:9px;border-radius:999px;background:#e2e8f0;overflow:hidden;"><div data-plan-progress="true" style="width:0%;height:100%;border-radius:999px;background:#f4b942;"></div></div></div>`;
}

function renderConsoleFindings(report, options = {}) {
  const filters = ["all", "critical", "high", "medium"];
  const fixedFindings = (options.fixedIds || []).map((id) => FINDINGS[id] ? { ...FINDINGS[id], questionId: id, domain: QUESTIONS.find((domain) => domain.questions.some((question) => question.id === id))?.domain || "Fixed finding" } : null).filter(Boolean);
  const allFindings = fixedFindings.concat(report.topFindings, report.plan.flatMap((tier) => tier.items));
  const filtered = (options.findingFilter === "all" ? allFindings : allFindings.filter((finding) => finding.severity === options.findingFilter)).filter((finding, index, list) => list.findIndex((item) => item.questionId === finding.questionId) === index);
  const selected = filtered.find((finding) => finding.questionId === options.selectedFindingId) || filtered[0] || null;
  const filterButtons = filters.map((filter) => `<button type="button" data-finding-filter="${filter}" aria-pressed="${options.findingFilter === filter}" style="padding:7px 11px;border:1px solid ${options.findingFilter === filter ? "#20324a" : "#cbd5e1"};border-radius:999px;background:${options.findingFilter === filter ? "#20324a" : "#fff"};color:${options.findingFilter === filter ? "#fff" : "#475569"};font-size:12px;font-weight:800;cursor:pointer;">${filter === "all" ? "All" : filter[0].toUpperCase() + filter.slice(1)}</button>`).join("");
  const rows = filtered.length ? filtered.map((finding) => { const fixed = options.fixedIds?.includes(finding.questionId); return `<button type="button" data-finding-open="${escapeHtml(finding.questionId)}" aria-pressed="${finding.questionId === selected?.questionId}" style="display:block;width:100%;padding:13px 14px;border:1px solid ${finding.questionId === selected?.questionId ? "#20324a" : "#e2e8f0"};border-left:4px solid ${fixed ? "#16a34a" : finding.severity === "critical" ? "#dc2626" : finding.severity === "high" ? "#d97706" : "#64748b"};border-radius:12px;background:${finding.questionId === selected?.questionId ? "#f8fafc" : "#fff"};text-align:left;cursor:pointer;margin:0 0 8px;"><span style="display:block;font-size:14px;font-weight:800;color:#172033;">${escapeHtml(finding.title)}</span><span style="display:block;margin-top:4px;font-size:12px;color:${fixed ? "#166534" : "#475569"};">${fixed ? "Fixed" : `${escapeHtml(finding.domain)} · ${escapeHtml(finding.severity)}`}</span></button>`; }).join("") : `<p style="color:#475569;">No findings in this filter.</p>`;
  const selectedFixed = options.fixedIds?.includes(selected?.questionId);
  const detail = selected ? renderVerdictFinding(selected, { openDetail: true, fixed:selectedFixed, fixButton: options.interactive ? (selectedFixed ? `<button type="button" data-unfix-id="${escapeHtml(selected.questionId)}" style="border:1px solid #166534;border-radius:999px;background:#dcfce7;color:#166534;padding:7px 11px;font-size:12px;font-weight:800;cursor:pointer;">Fixed / Undo</button>` : `<button type="button" data-fix-id="${escapeHtml(selected.questionId)}" style="border:1px solid #166534;border-radius:999px;background:#f0fdf4;color:#166534;padding:7px 11px;font-size:12px;font-weight:800;cursor:pointer;">Fix this</button>`) : "" }) : `<p style="color:#475569;">Select a finding to see its full detail.</p>`;
  return `<section data-console-panel="findings" ${options.activeSection === "findings" ? "" : "hidden"} style="padding:24px;"><div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;"><div><p style="margin:0;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">Findings</p><h2 style="margin:4px 0 0;font-size:28px;color:#172033;">Open exposures</h2></div><div style="display:flex;gap:6px;flex-wrap:wrap;">${filterButtons}</div></div><div style="display:grid;grid-template-columns:minmax(220px,.85fr) minmax(280px,1.15fr);gap:16px;margin-top:18px;"><div>${rows}</div><div style="padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;min-height:220px;"><p style="margin:0 0 10px;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#64748b;">Finding detail</p>${detail}</div></div></section>`;
}

function renderConsole(container, report, options = {}) {
  const activeSection = options.activeSection || "overview";
  const navItems = [
    ["overview", "Overview"],
    ["story", "Breach Story"],
    ["findings", "Findings"],
    ["devices", "Coverage"],
    ["plan", "Plan"],
  ];
  const nav = navItems.map(([id, label]) => `<button type="button" data-console-nav="${id}" aria-current="${activeSection === id ? "page" : "false"}" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:0;border-radius:9px;background:${activeSection === id ? "#334155" : "transparent"};color:${activeSection === id ? "#fff" : "#cbd5e1"};text-align:left;font-size:14px;font-weight:700;cursor:pointer;">${label}</button>`).join("");
  const topbar = `<header style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 22px;border-bottom:1px solid #e2e8f0;background:#fff;"><div><p style="margin:0;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#64748b;">Meridian Security Console</p><h1 style="margin:4px 0 0;font-size:20px;color:#172033;">${escapeHtml(report.company.name)}</h1></div><div style="display:flex;align-items:center;gap:12px;"><span style="font-size:12px;color:#64748b;">Overall score</span>${scoreGauge(report)}<button id="${options.downloadId || "download-sample-btn"}" type="button" style="padding:9px 13px;border-radius:9px;border:1px solid #20324a;background:#20324a;color:#fff;font-size:12px;font-weight:800;cursor:pointer;">Download report</button><span id="download-confirmation" hidden aria-live="polite" style="padding:8px 10px;border-radius:8px;background:#dcfce7;color:#166534;font-size:12px;font-weight:800;">Downloaded</span></div></header>`;
  const fixedCards = (options.fixedIds || []).map((id, index) => FINDINGS[id] ? `<div class="finding-card" data-finding-id="${escapeHtml(id)}" style="margin:0 0 10px;opacity:.78;">${renderVerdictFinding(FINDINGS[id], { rank:index + 1, fixed:true, fixButton:`<button type="button" data-unfix-id="${escapeHtml(id)}" style="border:1px solid #166534;border-radius:999px;background:#dcfce7;color:#166534;padding:7px 11px;font-size:12px;font-weight:800;cursor:pointer;">Fixed / Undo</button>` })}</div>` : "").join("");
  const quickActions = `<div class="console-quick-actions"><button type="button" data-console-nav="findings"><span>Explore the exposure<small>Open the full finding library</small></span><span aria-hidden="true">↗</span></button><button type="button" data-console-nav="plan"><span>See the action plan<small>Turn priorities into next steps</small></span><span aria-hidden="true">↗</span></button></div>`;
  const overview = `<section data-console-panel="overview" ${activeSection === "overview" ? "" : "hidden"} style="padding:24px;">${quickActions}<div>${renderLeadSection(report.lead)}</div>${renderStory(report.story)}<div style="margin-top:8px;"><h2 style="margin:0 0 12px;font-size:20px;color:#172033;">Urgent alerts</h2>${report.topFindings.map((finding, index) => `<div class="finding-card" data-finding-id="${escapeHtml(finding.questionId)}" style="margin:0 0 10px;">${renderVerdictFinding(finding, { rank:index + 1, fixButton: options.interactive ? `<button type="button" data-fix-id="${escapeHtml(finding.questionId)}" style="border:1px solid #166534;border-radius:999px;background:#f0fdf4;color:#166534;padding:7px 11px;font-size:12px;font-weight:800;cursor:pointer;">Fix this</button>` : "" })}</div>`).join("")}${fixedCards}</div></section>`;
  const storyPanel = `<section data-console-panel="story" ${activeSection === "story" ? "" : "hidden"} style="padding:24px;">${renderStory(report.story)}</section>`;
  const devicesPanel = `<section data-console-panel="devices" ${activeSection === "devices" ? "" : "hidden"} style="padding:24px;"><p style="margin:0;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">Coverage by domain</p><h2 style="margin:4px 0 16px;font-size:28px;line-height:1.15;color:#172033;">Coverage by domain</h2><p style="margin:0 0 16px;color:#475569;font-size:15px;">Approximately 150 endpoints across Meridian's six security domains.</p>${renderDomainCards(report, options)}</section>`;
  const planPanel = `<section data-console-panel="plan" ${activeSection === "plan" ? "" : "hidden"} style="padding:24px;"><p style="margin:0;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">Plan</p><h2 style="margin:4px 0 16px;font-size:28px;color:#172033;">30/60/90-day remediation</h2>${renderConsolePlan(report)}</section>`;
  const assessmentCta = options.showAssessment === false ? "" : `<div style="margin-top:28px;padding:12px 10px;border-top:1px solid #334155;"><p style="margin:0 0 9px;font-size:11px;color:#94a3b8;">Assessment</p><button id="start-btn" type="button" style="width:100%;padding:10px;border:0;border-radius:9px;background:#f4b942;color:#172033;font-size:12px;font-weight:900;cursor:pointer;">Run assessment</button></div>`;
  container.innerHTML = `<div style="display:grid;grid-template-columns:280px minmax(0,1fr);min-height:760px;border:1px solid #cbd5e1;border-radius:18px;overflow:hidden;background:#f8fafc;box-shadow:0 18px 50px rgba(15,23,42,.10);"><aside style="padding:20px 14px;background:#172033;color:#fff;"><div style="margin:0 8px 18px;">${brandLockup(240, true)}</div><div style="margin:0 8px 28px;"><strong style="display:block;font-size:16px;color:#fff;">Meridian</strong><span style="font-size:11px;color:#f4b942;letter-spacing:.12em;">SECURITY CONSOLE</span></div><nav aria-label="Console navigation" style="display:grid;gap:4px;">${nav}</nav>${assessmentCta}</aside><div style="min-width:0;overflow:hidden;">${topbar}<main>${renderWhatIfStatus(report, options)}${overview}${storyPanel}${renderConsoleFindings(report, options)}${devicesPanel}${planPanel}</main></div></div>`;
  container.firstElementChild?.classList.add("meridian-console");
}

// Triggers a browser download of the standalone report file.
function downloadReport(report) {
  const html = renderReportDocument(report);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const slug = report.company.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `${slug}-security-posture-assessment.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pdfText(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfLines(text, maxChars = 78) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    if ((line + " " + word).trim().length > maxChars && line) { lines.push(line); line = word; }
    else line = (line + " " + word).trim();
  });
  if (line) lines.push(line);
  return lines;
}

async function downloadPdf(report) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#172033";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const logo = new Image();
  logo.src = BRAND_WORDMARK_LIGHT;
  await new Promise((resolve) => { logo.onload = resolve; logo.onerror = resolve; });
  if (logo.naturalWidth) ctx.drawImage(logo, 70, 105, 830, 200);
  const data = canvas.toDataURL("image/jpeg", 0.92).split(",")[1];
  const binary = atob(data);
  const imageBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) imageBytes[i] = binary.charCodeAt(i);
  const imageHex = Array.from(imageBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const encoder = new TextEncoder();
  const parts = [];
  const offsets = [];
  let length = 0;
  const add = (bytes) => { parts.push(bytes); length += bytes.length; };
  const addObject = (body) => { offsets.push(length); add(encoder.encode(`${offsets.length} 0 obj\n${body}\nendobj\n`)); };
  const stream = [];
  const text = (x, y, size, value, colour = "0.09 0.13 0.20 rg") => stream.push(`${colour}\nBT /F1 ${size} Tf ${x} ${y} Td (${pdfText(value)}) Tj ET`);
  stream.push("0 0 0 rg 0 650 612 142 re f");
  stream.push("q 360 0 0 126 36 666 cm /Im1 Do Q");
  text(36, 620, 9, "ISAAC PALOMINO  |  MERIDIAN SECURITY CONSOLE", "0.96 0.73 0.26 rg");
  text(36, 580, 25, "Security posture assessment");
  text(36, 548, 12, report.company.name, "0.29 0.35 0.44 rg");
  text(36, 500, 11, "OVERALL POSTURE", "0.29 0.35 0.44 rg");
  text(36, 455, 48, `${report.overallScore} / 100`);
  text(280, 470, 14, RATING_LABEL[report.overallRating].toUpperCase(), report.overallRating === "red" ? "0.86 0.15 0.20 rg" : "0.85 0.48 0.02 rg");
  text(280, 448, 10, "Current exposure rating", "0.29 0.35 0.44 rg");
  let y = 390;
  if (report.lead.biggestPain) {
    text(36, y, 10, "BIGGEST PAIN", "0.86 0.15 0.20 rg"); y -= 22;
    pdfLines(report.lead.biggestPain.pain, 78).slice(0, 3).forEach((line) => { text(36, y, 14, line); y -= 20; });
    y -= 12;
  }
  text(36, y, 10, "TOP FINDINGS", "0.29 0.35 0.44 rg"); y -= 22;
  report.topFindings.forEach((finding, index) => { pdfLines(`${index + 1}. ${finding.title}`, 78).slice(0, 2).forEach((line) => { text(36, y, 11, line); y -= 16; }); y -= 4; });
  y -= 10;
  text(36, y, 10, "NEXT 30 / 60 / 90 DAYS", "0.29 0.35 0.44 rg"); y -= 22;
  report.plan.flatMap((tier) => tier.items).slice(0, 6).forEach((finding) => { pdfLines(`- ${finding.title}`, 78).slice(0, 1).forEach((line) => { text(36, y, 10, line); y -= 15; }); });
  text(36, 28, 8, `Fictional demo report · Generated ${report.generatedAt}`, "0.40 0.45 0.52 rg");
  const contentString = stream.join("\n");
  const content = encoder.encode(contentString);
  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 5 0 R >> >> /Contents 6 0 R >>");
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObject(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${imageHex.length + 1} >>\nstream\n${imageHex}>\nendstream`);
  addObject(`<< /Length ${content.length} >>\nstream\n${contentString}\nendstream`);
  const header = encoder.encode("%PDF-1.4\n%âãÏÓ\n");
  const all = [header, ...parts];
  let total = header.length;
  parts.forEach((part) => { total += part.length; });
  const xrefOffset = total;
  let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => { xref += `${String(offset + header.length).padStart(10, "0")} 00000 n \n`; });
  xref += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  all.push(encoder.encode(xref));
  const blob = new Blob(all, { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "IsaacP-Demo.pdf";
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SAMPLE_ANSWERS, buildReport, collectRaisedFindings, renderReportBody, renderReportDocument, escapeHtml };
}
