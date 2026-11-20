// Question set for the SMB Security Posture Assessment (Demo 1). 12 questions, 2 per domain.
// Fictional company: Meridian Logistics Group (120 people, ~150 endpoints).
// Each answer is scored: "yes" = 2, "partly" = 1, "no" = 0.
// Scoring logic lives in js/scoring.js.

const ANSWER_OPTIONS = [
  { value: "yes", label: "Yes", points: 2 },
  { value: "partly", label: "Partly", points: 1 },
  { value: "no", label: "No", points: 0 },
];

const QUESTIONS = [
  {
    id: "identity-mfa",
    domain: "Identity & MFA",
    questions: [
      {
        id: "identity-mfa-1",
        text: "Do all staff sign in to email and cloud apps with multi-factor authentication (MFA)?",
      },
      {
        id: "identity-mfa-2",
        text: "When someone leaves Meridian, are their logins disabled on the same day?",
      },
    ],
  },
  {
    id: "patching-endpoints",
    domain: "Patching & endpoints",
    questions: [
      {
        id: "patching-endpoints-1",
        text: "Are operating system and browser updates installed on laptops and desktops within a month of release?",
      },
      {
        id: "patching-endpoints-2",
        text: "Does every company computer run antivirus or endpoint protection that reports to a central console?",
      },
    ],
  },
  {
    id: "backup-dr",
    domain: "Backup & DR",
    questions: [
      {
        id: "backup-dr-2",
        text: "Is at least one backup stored away from the office, or in a cloud location that is separate from the main systems?",
      },
      {
        id: "backup-dr-3",
        text: "Has someone restored a sample of files or a system from backup in the past 6 months to confirm it works?",
      },
    ],
  },
  {
    id: "email-security",
    domain: "Email security",
    questions: [
      {
        id: "email-security-1",
        text: "Does your email system filter out spam, malware, and suspicious attachments before they reach staff?",
      },
      {
        id: "email-security-4",
        text: "Is there a set process for verifying payment or bank detail changes that arrive by email?",
      },
    ],
  },
  {
    id: "network-remote",
    domain: "Network & remote access",
    questions: [
      {
        id: "network-remote-2",
        text: "Do staff connect from home or on the road through a secure method such as a VPN or a managed remote access tool?",
      },
      {
        id: "network-remote-3",
        text: "Have default passwords on routers, firewalls, and printers been changed?",
      },
    ],
  },
  {
    id: "people-policy",
    domain: "People & policy",
    questions: [
      {
        id: "people-policy-2",
        text: "Does someone have clear responsibility for security, even if it is a part-time or outside role?",
      },
      {
        id: "people-policy-3",
        text: "Do staff know how to report a suspected security incident, and who to call?",
      },
    ],
  },
];
