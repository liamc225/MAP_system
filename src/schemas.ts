import { z } from "zod";

// --- Task input schema ---

export const evidenceInputSchema = z.object({
  account: z.string().describe("Account name"),
  evidence_type: z
    .enum(["email", "meeting_notes", "slack_message"])
    .describe("Source type of the evidence"),
  content: z.string().describe("Raw evidence text to analyze"),
});

export type EvidenceInput = z.infer<typeof evidenceInputSchema>;

// --- MAP verification output schemas (ported from models.py) ---

export const mapCommitmentSchema = z.object({
  account: z.string(),
  committer_name: z.string().nullable().describe("Name of the person who made the commitment"),
  committer_title: z
    .string()
    .nullable()
    .describe("Title of the person who made the commitment"),
  campaigns: z.array(z.string()).describe("Specific campaigns mentioned"),
  timeline: z.string(),
  quarters_committed: z.number().int(),
  evidence_type: z
    .string()
    .describe("email, meeting_notes, slack_message, etc."),
});

export type MAPCommitment = z.infer<typeof mapCommitmentSchema>;

export const mapVerificationSchema = z.object({
  account: z.string(),
  commitment: mapCommitmentSchema,
  evidence_quality: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "How trustworthy is the evidence source? Employer-originated > AE meeting notes > AE Slack"
    ),
  evidence_quality_label: z.enum(["strong", "moderate", "weak"]),
  commitment_strength: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "How firm and specific is the commitment language? Named campaigns + quarters > vague interest"
    ),
  commitment_strength_label: z.enum(["firm", "conditional", "exploratory"]),
  signals_for: z
    .array(z.string())
    .describe("Signals supporting a real commitment"),
  signals_against: z
    .array(z.string())
    .describe("Signals suggesting soft or uncertain commitment"),
  follow_up_actions: z.array(z.string()),
  quota_recommendation: z.enum([
    "count",
    "count_with_conditions",
    "do_not_count",
  ]),
  reasoning: z.string(),
});

export type MAPVerification = z.infer<typeof mapVerificationSchema>;
