import type { GatekeeperInput, GatekeeperResult, ReasonCode } from './types';
import {
	isBlankString,
	looksLikeRegion,
	minLengthOk,
	normalizeText,
	parseCapitalToNumber,
} from './validators';

/**
 * Gatekeeper v1.0 — чистая функция.
 * Никакого I/O, никакого UI, никакого AI.
 */
export function runGatekeeper(raw: GatekeeperInput): GatekeeperResult {
	const reason_codes: ReasonCode[] = [];
	const notes: string[] = [];

	const input: GatekeeperInput = {
		problem: typeof raw.problem === 'string' ? normalizeText(raw.problem) : '',
		goal: typeof raw.goal === 'string' ? normalizeText(raw.goal) : '',
		region: typeof raw.region === 'string' ? normalizeText(raw.region) : '',
		capital: raw.capital,
		time_horizon:
			typeof raw.time_horizon === 'string'
				? normalizeText(raw.time_horizon)
				: '',
		responsibility_confirmed: Boolean(raw.responsibility_confirmed),
		production_related: Boolean(raw.production_related),
		notes: raw.notes,
	};

	// ---- Stage 1: Problem ----
	if (isBlankString(input.problem) || !minLengthOk(input.problem, 15)) {
		return {
			decision: 'RETURN_WITH_CONDITIONS',
			stage: 'PROBLEM',
			reason_codes,
			missing_fields: ['problem'],
			notes: ['Problem отсутствует или слишком короткий (min 15 символов).'],
		};
	}

	// ---- Stage 2: Goal ----
	if (isBlankString(input.goal) || !minLengthOk(input.goal, 10)) {
		return {
			decision: 'RETURN_WITH_CONDITIONS',
			stage: 'GOAL',
			reason_codes,
			missing_fields: ['goal'],
			notes: ['Goal отсутствует или слишком короткий (min 10 символов).'],
		};
	}

	// ---- Stage 3: Constraints ----
	if (isBlankString(input.region) || !looksLikeRegion(input.region)) {
		return {
			decision: 'RETURN_WITH_CONDITIONS',
			stage: 'CONSTRAINTS',
			reason_codes,
			missing_fields: ['region'],
			notes: ['Region не указан или некорректен.'],
		};
	}

	if (!input.capital || isBlankString(String(input.capital))) {
		return {
			decision: 'RETURN_WITH_CONDITIONS',
			stage: 'CONSTRAINTS',
			reason_codes,
			missing_fields: ['capital'],
			notes: ['Не указан стартовый капитал.'],
		};
	}

	if (isBlankString(input.time_horizon)) {
		return {
			decision: 'RETURN_WITH_CONDITIONS',
			stage: 'CONSTRAINTS',
			reason_codes,
			missing_fields: ['time_horizon'],
			notes: ['Не указан срок (time horizon).'],
		};
	}

	// ---- Stage 4: Responsibility ----
	if (!input.responsibility_confirmed) {
		reason_codes.push('RC-03');
		return {
			decision: 'HARD_FAIL',
			stage: 'RESPONSIBILITY',
			reason_codes,
			missing_fields: ['responsibility_confirmed'],
			notes: ['Без принятия ответственности анализ запрещён.'],
		};
	}

	// ---- Stage 5: Reality check ----
	const goalLower = input.goal.toLowerCase();
	const fantasyMarkers = [
		'миллион за неделю',
		'миллион в день',
		'без вложений',
		'100% без риска',
		'гарантированный доход',
	];

	if (fantasyMarkers.some((m) => goalLower.includes(m))) {
		reason_codes.push('RC-04');
		return {
			decision: 'HARD_FAIL',
			stage: 'REALITY',
			reason_codes,
			missing_fields: [],
			notes: ['Цель содержит признаки нереалистичного сценария.'],
		};
	}

  const realityText = '${input.problem} ${input.goal}'.toLowerCase();

	// ---- Stage 6: Legality ----
	const combined = '${input.problem} ${input.goal}'.toLowerCase();
	const illegalMarkers = [
		'обойти закон',
		'без документов',
		'нелегально',
		'серый',
		'отмыв',
		'контрабанд',
		'взлом',
	];

	if (illegalMarkers.some((m) => combined.includes(m))) {
		reason_codes.push('RC-05');
		return {
			decision: 'HARD_FAIL',
			stage: 'LEGALITY',
			reason_codes,
			missing_fields: [],
			notes: ['Обнаружены признаки незаконной деятельности.'],
		};
	}

	// ---- Stage 7: Resource fit (production only) ----
if (input.production_related) {
  const cap = parseCapitalToNumber(input.capital);

  if (cap === null) {
    reason_codes.push("RC-07");
    return {
      decision: "RETURN_WITH_CONDITIONS",
      stage: "RESOURCE_FIT",
      reason_codes,
      missing_fields: ["capital"],
      notes: ["Капитал указан в непарсируемом формате. Уточни сумму или диапазон."],
    };
  }

  if (cap < 100_000) {
    reason_codes.push("RC-09");
    return {
      decision: "RETURN_WITH_CONDITIONS",
      stage: "RESOURCE_FIT",
      reason_codes,
      missing_fields: [],
      notes: [
        "Производственный кейс: заявленный капитал выглядит недостаточным (минимум 100 000 в v1).",
      ],
    };
  }
}

	// ---- ADMITTED ----
	return {
		decision: 'ADMITTED',
		stage: 'RESOURCE_FIT',
		reason_codes,
		missing_fields: [],
		notes: ['Gatekeeper v1 пройден. Допуск к Analysis разрешён.'],
	};
}
