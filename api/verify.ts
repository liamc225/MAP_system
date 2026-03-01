import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { evidenceInputSchema, mapVerificationSchema } from "../src/schemas.js";
import { SYSTEM_PROMPT } from "../src/prompt.js";

const ACCESS_KEY = "rula-case-study-2026";
const client = new Anthropic();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (req.body?.access_key !== ACCESS_KEY) {
    return res.status(403).json({ error: "Invalid access key" });
  }

  const parsed = evidenceInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }

  const payload = parsed.data;

  const userPrompt = `Analyze this MAP evidence and produce a structured verification assessment.

**Account**: ${payload.account}
**Evidence Type**: ${payload.evidence_type}
**Evidence**:
${payload.content}

Produce a complete MAPVerification with all fields populated. Be rigorous — this assessment determines whether this commitment counts toward quota and is used for revenue forecasting.`;

  try {
    const message = await client.messages.parse({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      output_config: {
        format: zodOutputFormat(mapVerificationSchema),
      },
    });

    return res.status(200).json(message.parsed_output);
  } catch (err) {
    console.error("Anthropic API error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
}
