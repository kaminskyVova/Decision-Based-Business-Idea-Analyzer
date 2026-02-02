import { normalizeText } from "./validators";

export type TextIssue =
  | "EMPTY"
  | "TOO_SHORT"
  | "NO_LETTERS"
  | "LOW_ENTROPY"
  | "NOT_ENOUGH_TOKENS";

function hasLetters(s: string): boolean {
  return /[A-Za-zА-Яа-яЁё]/.test(s);
}

function isLowEntropyRepeat(s: string): boolean {
  const t = s.replace(/\s+/g, "");
  if (t.length < 6) return false;
  const uniq = new Set(t.split(""));
  return uniq.size === 1;
}

function tokenize(s: string): string[] {
  return s
    .split(/[^A-Za-zА-Яа-яЁё0-9]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function validateMeaningfulText(
  raw: unknown,
  opts: {
    minLen?: number;
    minTokens?: number;
    allowEmpty?: boolean;
  } = {},
):
  | { ok: true; value: string }
  | { ok: false; issue: TextIssue; value: string } {
  const value = typeof raw === "string" ? normalizeText(raw) : "";

  if (!value) {
    if (opts.allowEmpty) return { ok: true, value: "" };
    return { ok: false, issue: "EMPTY", value };
  }

  const minLen = opts.minLen ?? 3;
  if (value.length < minLen) return { ok: false, issue: "TOO_SHORT", value };

  if (!hasLetters(value)) return { ok: false, issue: "NO_LETTERS", value };

  if (isLowEntropyRepeat(value)) return { ok: false, issue: "LOW_ENTROPY", value };

  const minTokens = opts.minTokens ?? 1;
  if (minTokens > 1) {
    const toks = tokenize(value).filter((t) => t.length >= 2);
    if (toks.length < minTokens) return { ok: false, issue: "NOT_ENOUGH_TOKENS", value };
  }

  return { ok: true, value };
}

export function issueToNote(field: string, issue: TextIssue): string {
  switch (issue) {
    case "EMPTY":
      return `Поле "${field}" пустое.`;
    case "TOO_SHORT":
      return `Поле "${field}" слишком короткое.`;
    case "NO_LETTERS":
      return `Поле "${field}" не содержит букв (только цифры/знаки).`;
    case "LOW_ENTROPY":
      return` Поле "${field}" содержит повторяющиеся символы (мусорный ввод).`;
    case "NOT_ENOUGH_TOKENS":
      return `Поле "${field}" должно содержать хотя бы 2 осмысленных слова.`;
    default:
      return` Поле "${field}" заполнено некорректно.`;
  }
}