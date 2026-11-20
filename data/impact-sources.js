// Impact sources for the SMB Security Posture Assessment (Demo 1).
// Every figure below is from a named public source with a link. Nothing is invented.
// Where a finding has no direct published statistic, its entry says so and is labeled "estimate".
// Status: DRAFT for review (step 2). Figures are wired into findings in step 3.

const IMPACT_SOURCES = {
  ibm2026: {
    publisher: "IBM and Ponemon Institute",
    title: "Cost of a Data Breach Report 2026",
    url: "https://www.ibm.com/reports/data-breach",
    note: "Global average and US average breach cost, 2026 report.",
  },
  ibm2026us: {
    publisher: "IBM and Ponemon Institute",
    title: "Cost of a Data Breach Report 2026",
    url: "https://www.ibm.com/reports/data-breach",
    note: "Source for the US average of $11.5 million in the IBM 2026 report.",
  },
  ibm2025detect: {
    publisher: "IBM and Ponemon Institute (via Help Net Security)",
    title: "Average global data breach cost now $4.44 million",
    url: "https://helpnetsecurity.com/2025/08/04/ibm-cost-data-breach-report-2025",
    note: "2025 report: breaches the organization detected itself cost about $900,000 less than breaches disclosed by an attacker.",
  },
  ibm2025recover: {
    publisher: "CSO Online (summarizing IBM 2025)",
    title: "What is the cost of a data breach?",
    url: "https://www.csoonline.com/article/3304358/what-is-the-cost-of-a-data-breach.html",
    note: "2025 report: nearly all organizations had operational disruption, averaging 100 days to recover.",
  },
  verizonSmbRansomware: {
    publisher: "Verizon Business",
    title: "2025 Data Breach Investigations Report",
    url: "https://www.helpnetsecurity.com/2025/04/23/verizon-2025-data-breach-investigations-report-dbir/",
    fullReport: "https://www.netaonline.org/sites/default/files/uploads/documents/2025-dbir-data-breach-investigations-report.pdf",
    note: "SMB breaches involved ransomware 88% of the time (vs 39% for larger organizations). Full report copy is hosted by NETA.",
  },
  verizonVectors: {
    publisher: "Verizon Business",
    title: "2025 Data Breach Investigations Report (initial access vectors)",
    url: "https://www.helpnetsecurity.com/2025/04/23/verizon-2025-data-breach-investigations-report-dbir/",
    note: "Credential abuse 22% and vulnerability exploitation 20% of initial access; exploitation up 34% year over year.",
  },
  verizonByod: {
    publisher: "Verizon Business",
    title: "2025 Data Breach Investigations Report (infostealer findings)",
    url: "https://www.securitymagazine.com/articles/101569-verizon-2025-data-breach-investigations-report-shows-rise-in-cyberattacks",
    note: "46% of compromised systems with corporate logins were non-managed devices.",
  },
  microsoftMfa: {
    publisher: "Microsoft Research",
    title: "How effective is multifactor authentication at deterring cyberattacks?",
    url: "https://www.microsoft.com/research/publication/how-effective-is-multifactor-authentication-at-deterring-cyberattacks/",
    note: "MFA reduces the risk of account compromise by 99.22% across the population, and 98.56% for accounts with leaked credentials.",
  },
  fbiIc3: {
    publisher: "FBI Internet Crime Complaint Center (IC3)",
    title: "2025 Internet Crime Report",
    url: "https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf",
    note: "Business email compromise losses: $3,046,598,558 in 2025. About 25,000 complaints per press coverage of the same report.",
  },
  sophosBackups: {
    publisher: "Sophos",
    title: "The impact of compromised backups on ransomware outcomes",
    url: "https://www.sophos.com/en-us/blog/the-impact-of-compromised-backups-on-ransomware-outcomes",
    note: "Survey of 2,974 organizations hit by ransomware: 85% with compromised backups had data encrypted, vs 52% without. Attackers tried to compromise backups in 94% of cases.",
  },
};

// Headline figures. Each carries its scope.
const HEADLINE_FIGURES = [
  { value: "88%", label: "of SMB breaches involved ransomware", scope: "SMB", source: "verizonSmbRansomware" },
  { value: "$11.5M", label: "average breach cost in the US (global average $4.99M)", scope: "US, all sizes, 2026", source: "ibm2026us" },
  { value: "$3.05B", label: "reported US business email compromise losses in 2025", scope: "US, all reported complaints", source: "fbiIc3" },
];

// Value of fixing the top 3 findings. This is an ESTIMATE, not a measured result.
// It uses one sourced baseline and one stated assumption. It does not add figures from different studies.
const TOP3_VALUE_ESTIMATE = {
  label: "Estimated value of fixing the top 3 findings",
  isEstimate: true,
  baseline: {
    value: 11500000,
    display: "$11.5M",
    what: "IBM average breach cost in the US, 2026",
    scope: "US, all sizes",
    source: "ibm2026us",
  },
  // Derived: baseline x 1% = expected cost of a 1-point change in yearly breach likelihood.
  perPointOfRiskReduction: 115000,
  perPointDisplay: "about $115,000 a year",
  formula: "$11.5M x 1% = $115,000 per year for each 1 point of yearly breach likelihood removed",
  assumptions: [
    "The IBM US average is used as the cost of one breach. It covers all sizes, so it is likely higher than Meridian's own cost; treat it as an upper bound.",
    "The estimate assumes at most one breach a year.",
    "How many points of breach likelihood the top 3 fixes remove is an input the assessor sets. This demo does not measure it.",
    "The top 3 findings are the ones this assessment ranks highest for this company, using the scoring rules in js/scoring.js.",
  ],
};
