// Scoring engine for the SMB Security Posture Assessment (Demo 1).
// Depends on ANSWER_OPTIONS and QUESTIONS from data/questions.js.
//
// Rules:
// - Each answer is worth 2 (yes), 1 (partly), or 0 (no). Unanswered = 0 and is counted as incomplete.
// - Domain score = points earned / max points for that domain, as a percentage (0-100, rounded).
// - Domain rating: green = 75 or higher, amber = 50 to 74, red = below 50.
// - Overall score = simple average of the six domain scores (equal weight), rounded.
// - Overall rating uses the same thresholds as domains, but is capped at amber
//   if any domain is red (the overall number is still the straight average).

const RATING_THRESHOLDS = { green: 75, amber: 50 };

function pointsForAnswer(value) {
  const option = ANSWER_OPTIONS.find((o) => o.value === value);
  return option ? option.points : 0;
}

function ratingForScore(score) {
  if (score >= RATING_THRESHOLDS.green) return "green";
  if (score >= RATING_THRESHOLDS.amber) return "amber";
  return "red";
}

// answers: { [questionId]: "yes" | "partly" | "no" }
function scoreDomain(domain, answers) {
  const maxPoints = domain.questions.length * 2;
  let earned = 0;
  let unanswered = 0;
  const questionResults = domain.questions.map((q) => {
    const value = answers[q.id];
    if (value === undefined) unanswered += 1;
    const points = pointsForAnswer(value);
    earned += points;
    return { id: q.id, text: q.text, answer: value || null, points };
  });
  const score = Math.round((earned / maxPoints) * 100);
  return {
    id: domain.id,
    domain: domain.domain,
    earned,
    maxPoints,
    score,
    rating: ratingForScore(score),
    unanswered,
    questions: questionResults,
  };
}

// Returns the full scored assessment.
function scoreAssessment(answers) {
  const domains = QUESTIONS.map((d) => scoreDomain(d, answers));
  const overall = Math.round(
    domains.reduce((sum, d) => sum + d.score, 0) / domains.length
  );
  // Cap: if any domain is red, the overall rating cannot read better than amber.
  // The overall score number itself stays the straight average.
  const anyRed = domains.some((d) => d.rating === "red");
  let overallRating = ratingForScore(overall);
  if (anyRed && overallRating === "green") overallRating = "amber";
  const totalUnanswered = domains.reduce((sum, d) => sum + d.unanswered, 0);
  return {
    overallScore: overall,
    overallRating,
    anyDomainRed: anyRed,
    domains,
    totalQuestions: domains.reduce((sum, d) => sum + d.questions.length, 0),
    totalUnanswered,
    complete: totalUnanswered === 0,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { RATING_THRESHOLDS, pointsForAnswer, ratingForScore, scoreDomain, scoreAssessment };
}
