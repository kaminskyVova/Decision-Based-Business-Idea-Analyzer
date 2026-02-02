import type { GatekeeperInput, GatekeeperResult } from "../core/gatekeeper/types";

export type AIPrecheckResult = {
  normalized: Pick<GatekeeperInput, "idea" | "goal"> & {
    context?: string;
    problem?: string;
  };
  reality: {
    verdict: "OK" | "SUSPECT" | "BULLSHIT";
    reasons: string[];
    confidence?: number;
  };
  clarification: {
    required: boolean;
    questions: string[];
  };
  notes: string[];
};

export type UiState =
  | "DRAFT"
  | "AI_CHECK_RUNNING"
  | "AI_NEEDS_CLARIFICATION"
  | "AI_HARD_STOP"
  | "GATEKEEPER_RUNNING"
  | "GATEKEEPER_RETURN"
  | "GATEKEEPER_HARD_FAIL"
  | "ADMITTED_CLEAN"
  | "ADMITTED_DIRTY";

export type ViewModel = {
  ui_state: UiState;
  draft: GatekeeperInput;
  ai?: AIPrecheckResult;
  gatekeeper?: GatekeeperResult;
  admitted_hash?: string;       // snapshot при ADMITTED
  status_key?: string;
};