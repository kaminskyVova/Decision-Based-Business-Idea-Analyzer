// ---- Decision ----
export type GatekeeperDecision =
  | "ADMITTED"
  | "RETURN_WITH_CONDITIONS"
  | "HARD_FAIL";

// ---- Stage ----
export type GatekeeperStage =
  | "PROBLEM"
  | "GOAL"
  | "CONSTRAINTS"
  | "RESPONSIBILITY"
  | "REALITY"
  | "LEGALITY"
  | "RESOURCE_FIT";

// ---- Reason Codes ----
export type ReasonCode =
  | "RC-01" // problem too vague
  | "RC-02" // goal not measurable
  | "RC-03" // responsibility not confirmed
  | "RC-04" // unrealistic / fantasy
  | "RC-05" // legality issues
  | "RC-06" // region invalid
  | "RC-07" // capital missing/unparsable
  | "RC-08" // time horizon missing/unparsable
  | "RC-09"; // resource mismatch (production)

// ---- Input ----
export type GatekeeperInput = {
  problem: string;
  goal: string;
  region: string;
  capital?: string | number;
  time_horizon: string;
  responsibility_confirmed: boolean;
  production_related: boolean;
  mandatory_expenses: boolean;
  notes?: string;
};

// ---- Core Result (DOMAIN) ----
export type GatekeeperResult = {
  decision: GatekeeperDecision;
  stage: GatekeeperStage;
  reason_codes: ReasonCode[];
  missing_fields: (keyof GatekeeperInput)[];
  notes: string[];
};