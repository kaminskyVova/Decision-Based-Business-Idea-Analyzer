// src/core/ai-guard/schema.ts
export const aiPrecheckJsonSchema = {
  name: "ai_precheck_response",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["verdict", "issues"],
    properties: {
      verdict: {
        type: "string",
        enum: ["OK", "NEEDS_CLARIFICATION", "BLOCK"],
      },

      normalized: {
        type: "object",
        additionalProperties: true, // частичная нормализация
      },

      issues: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["code", "message_key"],
          properties: {
            code: {
              type: "string",
              enum: [
                "GIBBERISH",
                "MISSING",
                "REALITY_RISK",
                "LEGALITY_RISK",
                "PROMPT_INJECTION",
                "SYSTEM_PUSH",
              ],
            },
            fields: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "idea",
                  "goal",
                  "context",
                  "problem",
                  "region.country",
                  "region.region",
                  "region.city",
                  "capital",
                  "time_horizon",
                  "responsibility_confirmed",
                ],
              },
            },
            message_key: { type: "string" },
          },
        },
      },

      clarification: {
        type: "object",
        additionalProperties: false,
        required: ["question_keys"],
        properties: {
          question_keys: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;