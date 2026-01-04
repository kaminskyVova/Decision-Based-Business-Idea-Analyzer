import type {
  GatekeeperDecision,
  GatekeeperStage,
} from "./types";

export type GatekeeperViewModel = {
  decision: GatekeeperDecision;
  stage: GatekeeperStage;
  reason_codes: string[];
  notes: string[];
  clarification_questions?: string[];
};