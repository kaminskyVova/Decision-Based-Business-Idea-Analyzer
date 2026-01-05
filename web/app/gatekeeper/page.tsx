'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ViewModel } from '../../src/ui/viewModel';
import type { GatekeeperInput } from '@/core/gatekeeper/types';
import { runGatekeeper } from '@/core/gatekeeper/gatekeeper';
import { hashInputForAdmit } from '../../src/ui/hash';
import { buildClarificationQuestions } from '@/core/clarification/clarification';

const emptyDraft: GatekeeperInput = {
	problem: '',
	goal: '',
	region: '',
	capital: '',
	time_horizon: '',
	responsibility_confirmed: false,
	production_related: false,
};

export default function Page() {
	const [vm, setVm] = useState<ViewModel>({
		ui_state: 'DRAFT',
		draft: emptyDraft,
	});

	const currentHash = useMemo(() => hashInputForAdmit(vm.draft), [vm.draft]);


  
	function getGatekeeperAlertStyle(decision?: string) {
		switch (decision) {
			case 'HARD_FAIL':
				return {
					background: '#fdecea',
					border: '1px solid #f44336',
					color: '#b71c1c',
				};
			case 'RETURN_WITH_CONDITIONS':
				return {
					background: '#fff8e1',
					border: '1px solid #ffb300',
					color: '#7a5200',
				};
			case 'ADMITTED':
				return {
					background: '#e8f5e9',
					border: '1px solid #4caf50',
					color: '#1b5e20',
				};
			default:
				return {
					background: '#f5f5f5',
					border: '1px solid #ddd',
					color: '#333',
				};
		}
	}

	// Invalidation: если был ADMITTED и данные изменились → ADMITTED_DIRTY
	useEffect(() => {
		if (vm.admitted_hash && vm.ui_state === 'ADMITTED_CLEAN') {
			if (currentHash !== vm.admitted_hash) {
				setVm((p) => ({
					...p,
					ui_state: 'ADMITTED_DIRTY',
					status_message: 'Данные изменены — требуется повторная проверка.',
				}));
			}
		}
	}, [currentHash, vm.admitted_hash, vm.ui_state]);

function updateDraft(patch: Partial<GatekeeperInput>) {
  setVm((prev) => {
    const nextDraft = { ...prev.draft, ...patch };

    // если уже допущено — любое изменение делает данные "грязными"
    const wasAdmitted = prev.ui_state === "ADMITTED_CLEAN";

    return {
      ...prev,
      draft: nextDraft,

      // ВАЖНО: при правке — убираем старые результаты и сообщения
      gatekeeper: wasAdmitted ? undefined : prev.gatekeeper,
      ai: wasAdmitted ? undefined : prev.ai,

      ui_state: wasAdmitted ? "ADMITTED_DIRTY" : prev.ui_state,
      status_message: wasAdmitted
        ? "Данные изменены — требуется повторная проверка."
        : undefined,
    };
  });
}

async function onPrecheck() {
  setVm((p) => ({ ...p, ui_state: "AI_CHECK_RUNNING" }));

  const res = await fetch("/api/ai-precheck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vm.draft),
  });

  if (!res.ok) {
    setVm((p) => ({ ...p, ui_state: "DRAFT" }));
    return;
  }

  const ai = await res.json();

  if (ai?.reality?.verdict === "BULLSHIT") {
    setVm((p) => ({
      ...p,
      ai,
      ui_state: "AI_HARD_STOP",
    }));
    return;
  }

  const canonicalDraft: GatekeeperInput = {
    ...vm.draft,
    ...ai.normalized,
    responsibility_confirmed: Boolean(vm.draft.responsibility_confirmed),
    production_related: Boolean(vm.draft.production_related),
  };

  const gatekeeper = runGatekeeper(canonicalDraft);

  if (gatekeeper.decision === "HARD_FAIL") {
    setVm((p) => ({
      ...p,
      ai,
      gatekeeper,
      ui_state: "GATEKEEPER_HARD_FAIL",
    }));
    return;
  }

  if (gatekeeper.decision === "RETURN_WITH_CONDITIONS") {
    setVm((p) => ({
      ...p,
      ai,
      gatekeeper,
      ui_state: "GATEKEEPER_RETURN",
    }));
    return;
  }

  // ✅ ADMITTED
  const admitted_hash = hashInputForAdmit(canonicalDraft);

  setVm((p) => ({
    ...p,
    ai,
    gatekeeper,
    draft: canonicalDraft,      // 🔑 синхронизация
    admitted_hash,
    ui_state: "ADMITTED_CLEAN",
    status_message: "Данные готовы (ADMITTED)",
  }));
}
	const analysisEnabled = vm.ui_state === 'ADMITTED_CLEAN';
	const precheckEnabled =
		vm.ui_state !== 'ADMITTED_CLEAN' &&
		vm.ui_state !== 'AI_CHECK_RUNNING' &&
		vm.ui_state !== 'GATEKEEPER_RUNNING';

	const clarificationQuestions = useMemo(() => {
		if (vm.ui_state === 'GATEKEEPER_RETURN' && vm.gatekeeper) {
			return buildClarificationQuestions(vm.gatekeeper);
		}
		if (vm.ui_state === 'AI_NEEDS_CLARIFICATION' && vm.ai) {
			return vm.ai.clarification.questions ?? [];
		}
		return [];
	}, [vm.ui_state, vm.gatekeeper, vm.ai]);

	return (
		<main
			style={{
				padding: 24,
				maxWidth: 900,
				margin: '0 auto',
				fontFamily: 'system-ui',
			}}
		>
			<h1>Decision-Based Business Idea Analyzer</h1>

			{vm.status_message && (
				<div
					style={{
						padding: 12,
						border: '1px solid #ddd',
						borderRadius: 8,
						marginTop: 12,
					}}
				>
					{vm.status_message}
				</div>
			)}

			{vm.gatekeeper && (
				<section
					style={{
						marginTop: 24,
						padding: 14,
						borderRadius: 8,
						...getGatekeeperAlertStyle(vm.gatekeeper.decision),
					}}
				>
					<strong>Gatekeeper: {vm.gatekeeper.decision}</strong>
					<div style={{ marginTop: 6 }}>
						{vm.gatekeeper.notes.map((n, i) => (
							<div key={i}>{n}</div>
						))}
					</div>
					{/* {JSON.stringify(vm.gatekeeper, null, 2)} */}
				</section>
			)}

			<section style={{ marginTop: 16 }}>
				<label>Problem</label>
				<textarea
					value={String(vm.draft.problem ?? '')}
					onChange={(e) => updateDraft({ problem: e.target.value })}
					placeholder="Что не работает сейчас? Контекст/пример."
					style={{ width: '100%', minHeight: 80, marginTop: 6 }}
				/>
			</section>

			<section style={{ marginTop: 16 }}>
				<label>Goal</label>
				<textarea
					value={String(vm.draft.goal ?? '')}
					onChange={(e) => updateDraft({ goal: e.target.value })}
					placeholder="Цель обращения: проверить целесообразность/актуальность или конкретный результат."
					style={{ width: '100%', minHeight: 70, marginTop: 6 }}
				/>
			</section>

			<section style={{ marginTop: 16 }}>
				<label>Region</label>
				<input
					value={String(vm.draft.region ?? '')}
					onChange={(e) => updateDraft({ region: e.target.value })}
					placeholder="Страна + регион (+город для оффлайн)."
					style={{ width: '100%', marginTop: 6, height: 36 }}
				/>
			</section>

			<section style={{ marginTop: 16 }}>
				<label>Capital</label>
				<input
					value={String(vm.draft.capital ?? '')}
					onChange={(e) => updateDraft({ capital: e.target.value })}
					placeholder="Напр.: 100000 / до 200000 / 100k"
					style={{ width: '100%', marginTop: 6, height: 36 }}
				/>
			</section>

			<section style={{ marginTop: 16 }}>
				<label>Time horizon</label>
				<input
					value={String(vm.draft.time_horizon ?? '')}
					onChange={(e) => updateDraft({ time_horizon: e.target.value })}
					placeholder="Опционально для допуска, но может помочь (напр.: 3 месяца)"
					style={{ width: '100%', marginTop: 6, height: 36 }}
				/>
			</section>

			<section style={{ marginTop: 16, display: 'flex', gap: 16 }}>
				<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<input
						type="checkbox"
						checked={Boolean(vm.draft.responsibility_confirmed)}
						onChange={(e) =>
							updateDraft({ responsibility_confirmed: e.target.checked })
						}
					/>
					Я принимаю решения сам (обязательно)
				</label>

				<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<input
						type="checkbox"
						checked={Boolean(vm.draft.production_related)}
						onChange={(e) =>
							updateDraft({ production_related: e.target.checked })
						}
					/>
					Производственный кейс
				</label>
			</section>

			<section style={{ marginTop: 20, display: 'flex', gap: 12 }}>
				<button
					disabled={!precheckEnabled}
					onClick={onPrecheck}
					style={{
						height: 40,
						padding: '0 14px',
						background: precheckEnabled ? '#111' : '#bbb',
					}}
				>
					Проверка данных
				</button>

				<button
					disabled={!analysisEnabled}
					style={{
						height: 40,
						padding: '0 14px',
						background: analysisEnabled ? '#111' : '#bbb',
						color: '#fff',
						border: 'none',
						borderRadius: 6,
						cursor: analysisEnabled ? 'pointer' : 'not-allowed',
						opacity: analysisEnabled ? 1 : 0.9,
					}}
				>
					Анализ
				</button>
			</section>

			{vm.ui_state === 'ADMITTED_CLEAN' && (
				<div style={{ marginTop: 10, color: '#444' }}>
					Проверка данных заблокирована: данные готовы. Любое изменение
					заблокирует анализ.
				</div>
			)}

			{vm.ui_state === 'ADMITTED_DIRTY' && (
				<div style={{ marginTop: 10, color: '#444' }}>
					Данные изменены. Сначала нажми “Проверка данных”.
				</div>
			)}

			{clarificationQuestions.length > 0 && (
				<section style={{ marginTop: 24 }}>
					<h3>Уточнения</h3>
					<ul>
						{clarificationQuestions.map((q, i) => (
							<li key={i}>{q}</li>
						))}
					</ul>
				</section>
			)}

			{/* {vm.gatekeeper && (
				<section
					style={{
						marginTop: 24,
						padding: 14,
						borderRadius: 8,
						...getGatekeeperAlertStyle(vm.gatekeeper.decision),
					}}
				>
					<strong>RESULT: {vm.gatekeeper.decision}</strong>
					<div style={{ marginTop: 6 }}>
						{vm.gatekeeper.notes.map((n, i) => (
							<div key={i}>{n}</div>
						))}
					</div>
					{/* {JSON.stringify(vm.gatekeeper, null, 2)} */}
			{/* </section> */}
			{/* )} */}

			{vm.ai && (
				<section style={{ marginTop: 24 }}>
					<h3>AI precheck</h3>
					<pre
						style={{
							whiteSpace: 'pre-wrap',
							padding: 12,
							border: '1px solid #ddd',
							borderRadius: 8,
						}}
					>
						{JSON.stringify(vm.ai, null, 2)}
					</pre>
				</section>
			)}
		</main>
	);
}
