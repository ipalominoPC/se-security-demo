// 30/60/90-day remediation tiers for the SMB Security Posture Assessment (Demo 1).
// Each finding is placed in a tier by its severity (see data/findings.js).
// The report view (js/report.js, later step) lists only the findings raised for this assessment.

const REMEDIATION_TIERS = [
  {
    days: 30,
    label: "First 30 days: stop the most likely losses",
    summary: "Close the critical gaps that attackers exploit most often: account takeover, unprotected endpoints, backups, payment fraud, and remote entry.",
  },
  {
    days: 60,
    label: "Days 31 to 60: harden access and recovery",
    summary: "Tighten access control, prove backups can be restored, and close the email and network gaps that make phishing and lateral movement easier.",
  },
  {
    days: 90,
    label: "Days 61 to 90: make it routine",
    summary: "Put reviews, inventories, training, and written policy in place so the controls keep working without heroics.",
  },
];
