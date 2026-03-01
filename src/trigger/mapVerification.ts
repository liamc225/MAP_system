import { schemaTask } from "@trigger.dev/sdk";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { evidenceInputSchema, mapVerificationSchema } from "../schemas.js";
import { SYSTEM_PROMPT } from "../prompt.js";

const client = new Anthropic();

export const verifyMapEvidence = schemaTask({
  id: "verify-map-evidence",
  schema: evidenceInputSchema,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload) => {
    const userPrompt = `Analyze this MAP evidence and produce a structured verification assessment.

**Account**: ${payload.account}
**Evidence Type**: ${payload.evidence_type}
**Evidence**:
${payload.content}

Produce a complete MAPVerification with all fields populated. Be rigorous — this assessment determines whether this commitment counts toward quota and is used for revenue forecasting.`;

    const message = await client.messages.parse({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      output_config: {
        format: zodOutputFormat(mapVerificationSchema),
      },
    });

    return message.parsed_output;
  },
});
