import type { AiModelResponse, AiPrecheckResponse } from "./types";

export function mapModelToPrecheck(model: AiModelResponse): AiPrecheckResponse {
  return {
    verdict: model.verdict,
    normalized: model.normalized,
    issues: model.issues ?? [],
    clarification: model.clarification ?? { question_keys: [] },
  };
}