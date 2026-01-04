import type { GatekeeperResult, GatekeeperInput } from "../gatekeeper/types";

type Question = string;

const FIELD_LABELS: Partial<Record<keyof GatekeeperInput, string>> = {
  problem: "Problem",
  goal: "Goal",
  region: "Region",
  capital: "Capital",
  time_horizon: "Time horizon",
  responsibility_confirmed: "Подтверждение ответственности",
};




export function buildClarificationQuestions(result: GatekeeperResult): Question[] {
  const qs: string[] = [];

  // Базово — по missing_fields
  for (const f of result.missing_fields ?? []) {
    switch (f) {
      case "problem":
        qs.push("Опиши проблему конкретно: что не работает, где потери, 1–2 примера. (мин. 15 символов)");
        break;
      case "goal":
        qs.push("Сформулируй цель измеримо: метрика + срок. (мин. 10 символов)");
        break;
      case "region":
        qs.push("Укажи регион в формате 'страна + город/регион' (например: 'Россия Крым', 'Norway Oslo').");
        break;
      case "capital":
        qs.push("Укажи капитал: число/диапазон/100k (например: '100000', 'до 200000', '100k').");
        break;
      case "time_horizon":
        qs.push("Укажи горизонт: 2 недели / 1 месяц / 6 месяцев (любой понятный текст).");
        break;
      case "responsibility_confirmed":
        qs.push("Подтверди ответственность чекбоксом — без этого запуск запрещён.");
        break;
      default:
        qs.push('Уточни поле: ${FIELD_LABELS[f] ?? String(f)}');
    }
  }

  // Дополнительно — по stage, если нужно
  if (result.stage === "LEGALITY") {
    qs.push("Уточни формулировки: кейс должен быть легальным. Убери любые намёки на обход закона.");
  }
  if (result.stage === "REALITY") {
    qs.push("Сними нереалистичные ожидания: цель должна быть достижима в срок и с ресурсами.");
  }

  return qs;
}