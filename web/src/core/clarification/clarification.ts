import type { GatekeeperResult, GatekeeperInput } from "../gatekeeper/types";

type QuestionKey = string;
type FieldKey =
  | keyof GatekeeperInput
  | "region.country"
  | "region.region"
  | "region.city";

export function buildClarificationQuestions(
  result: GatekeeperResult
): QuestionKey[] {
  const qs: string[] = [];

  for (const f of result.missing_fields ?? []) {
    switch (f) {
      case "idea":
        qs.push("gatekeeper.clarification.idea");
        break;

      case "goal":
        qs.push("gatekeeper.clarification.goal");
        break;

      case "context":
        qs.push("gatekeeper.clarification.context");
        break;

      case "problem":
        qs.push("gatekeeper.clarification.problem");
        break;

      case "region.country":
        qs.push("gatekeeper.clarification.region.country");
        break;

      case "region.region":
        qs.push("gatekeeper.clarification.region.region");
        break;

      case "region.city":
        qs.push("gatekeeper.clarification.region.city");
        break;

      case "capital":
        qs.push("gatekeeper.clarification.capital");
        break;

      case "time_horizon":
        qs.push("gatekeeper.clarification.time_horizon");
        break;

      case "responsibility_confirmed":
        qs.push("gatekeeper.clarification.responsibility");
        break;

      default:
        qs.push(`gatekeeper.clarification.${String(f)}`);
    }
  }

  if (result.stage === "LEGALITY") {
    qs.push("gatekeeper.clarification.legality");
  }

  if (result.stage === "REALITY") {
    qs.push("gatekeeper.clarification.reality");
  }

  return qs;
}