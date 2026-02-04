import type { GatekeeperInput } from "@/core/gatekeeper/types";

export type AiVerdict = "OK" | "NEEDS_CLARIFICATION" | "BLOCK";

export type AiIssueCode =
  | "GIBBERISH"
  | "MISSING"
  | "REALITY_RISK"
  | "LEGALITY_RISK"
  | "PROMPT_INJECTION"
  | "SYSTEM_PUSH";

export type AiField =
  | "idea"
  | "goal"
  | "context"
  | "problem"
  | "region.country"
  | "region.region"
  | "region.city"
  | "capital"
  | "time_horizon"
  | "responsibility_confirmed";

export type AiIssue = {
  code: AiIssueCode;
  fields?: AiField[];
  /** i18n key, UI переводит */
  message_key: string;
};

export type AiPrecheckResponse = {
  verdict: AiVerdict;

  /** безопасная нормализация (trim/пробелы), без угадываний */
  normalized?: Partial<GatekeeperInput>;

  /** факты/флаги */
  issues: AiIssue[];

  /** ключи уточнений (i18n), без свободного текста */
  clarification?: { question_keys: string[] };
};

export type AiModelResponse = {
  verdict: AiVerdict;
  normalized?: Partial<GatekeeperInput>;
  issues?: Array<{
    code: AiIssueCode;
    fields?: AiField[];
    message_key: string;
  }>;
  clarification?: { question_keys: string[] };
};