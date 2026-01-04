export type GatekeeperViewModel = {
  decision: "ADMITTED" | "RETURN_WITH_CONDITIONS" | "HARD_FAIL";
  stage: string;
  reason_codes: string[];
  notes: string[];
  clarification_questions?: string[];
};
