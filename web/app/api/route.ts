import { NextResponse } from 'next/server';
import type { AIPrecheckResult } from '@/ui/viewModel';
import type { GatekeeperInput } from '@/core/gatekeeper/types';
import { normalizeText } from '@/core/gatekeeper/validators';

export async function POST(req: Request) {
  const raw = (await req.json()) as GatekeeperInput;

  // Strict normalization — no guessing
  const idea =
    typeof raw.idea === 'string' ? normalizeText(raw.idea) : '';

  const goal =
    typeof raw.goal === 'string' ? normalizeText(raw.goal) : '';

  const context =
    typeof raw.context === 'string'
      ? normalizeText(raw.context)
      : '';

  const problem =
    typeof raw.problem === 'string'
      ? normalizeText(raw.problem)
      : '';

  // Combine for naive deterministic Reality Check
  const combined = `${idea} ${goal} ${context} ${problem}.toLowerCase()`;

  const fantasyMarkers = [
    'на луну',
    'на марс',
    'марс',
    'телепортац',
    'вечный двигатель',
    '100% без риска',
    'гарантированно',
    'гарантия 100%',
    'без вложений и риска',
  ];

  const isBullshit = fantasyMarkers.some((m) =>
    combined.includes(m),
  );

  const result: AIPrecheckResult = {
    normalized: {
      idea, // 🔑 ОБЯЗАТЕЛЬНО
      goal, // 🔑 ОБЯЗАТЕЛЬНО

      // строго по типу запроса
      context:
        raw.request_type === 'OPPORTUNITY'
          ? context || undefined
          : undefined,

      problem:
        raw.request_type === 'PROBLEM_SOLVING'
          ? problem || undefined
          : undefined,
    },

    reality: {
      verdict: isBullshit ? 'BULLSHIT' : 'OK',
      reasons: isBullshit
        ? [
            'Вводные содержат признаки нереалистичного сценария (Reality Check).',
          ]
        : [],
      confidence: isBullshit ? 0.9 : 0.7,
    },

    clarification: {
      required: false,
      questions: [],
    },

    notes: [],
  };

  return NextResponse.json(result);
}