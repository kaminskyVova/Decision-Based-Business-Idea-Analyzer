// ---- Decision ----
export type GatekeeperDecision = "ADMITTED" | "RETURN_WITH_CONDITIONS" | "HARD_FAIL";

// ---- Stage ----
export type GatekeeperStage =
  | "REQUEST"
  | "IDEA"
  | "PROBLEM"
  | "CONTEXT"
  | "GOAL"
  | "CONSTRAINTS"
  | "RESPONSIBILITY"
  | "REALITY"
  | "LEGALITY"
  | "RESOURCE_FIT";

// ---- Reason Codes ----
export type ReasonCode =
  | "RC-01" // missing/invalid core narrative fields
  | "RC-02" // goal invalid
  | "RC-03" // responsibility not confirmed
  | "RC-04" // unrealistic / fantasy
  | "RC-05" // legality issues
  | "RC-06" // region invalid
  | "RC-07" // capital missing/unparsable
  | "RC-08" // time horizon missing/unparsable (optional in UI v2)
  | "RC-09"; // resource mismatch (production)

// ---- Request / Project Types ----
export type RequestType = "OPPORTUNITY" | "PROBLEM_SOLVING";
export type ProjectType = "ONLINE" | "OFFLINE";

// ---- Region ----
export type RegionInput = {
  country: string;
  region: string;
  city?: string; // required for OFFLINE (and production)
};

// ---- Input ----
export type GatekeeperInput = {
  request_type: RequestType;
  project_type: ProjectType;

  // NEW: separated fields
  idea: string;
  goal: string;

  // Conditionally required
  context?: string; // required for OPPORTUNITY
  problem?: string; // required for PROBLEM_SOLVING

  region: RegionInput;

  capital?: string | number;

  // optional now (UI says optional)
  time_horizon?: string;

  // checkboxes
  mandatory_expenses_included: boolean;
  responsibility_confirmed: boolean;

  // production is still separate (you already have it)
  production_related: boolean;

  notes?: string;
};

// ---- Core Result (DOMAIN) ----
export type GatekeeperResult = {
  decision: GatekeeperDecision;
  stage: GatekeeperStage;
  reason_codes: ReasonCode[];
  missing_fields: (keyof GatekeeperInput | "region.country" | "region.region" | "region.city")[];
  notes: string[];
};