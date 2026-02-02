'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { dictionaries, type Lang } from '@/i18n/index';
import type { ViewModel } from '../../src/ui/viewModel';
import type { GatekeeperInput } from '@/core/gatekeeper/types';
import { runGatekeeper } from '@/core/gatekeeper/gatekeeper';
import { hashInputForAdmit } from '../../src/ui/hash';

const emptyDraft: GatekeeperInput = {
	request_type: 'OPPORTUNITY',
	project_type: 'OFFLINE',
	idea: '',
	goal: '',
	context: '',
	problem: '',
	region: { country: '', region: '', city: '' },
	capital: '',
	time_horizon: '',
	mandatory_expenses_included: false,
	responsibility_confirmed: false,
	production_related: false,
};

export default function Page() {
	const [vm, setVm] = useState<ViewModel>({
		ui_state: 'DRAFT',
		draft: emptyDraft,
	});

	const currentHash = useMemo(() => hashInputForAdmit(vm.draft), [vm.draft]);

	const [lang, setLang] = useState<Lang>('ru');

	const t = useCallback(
		(path: string) => {
			return (
				path
					.split('.')
					.reduce((acc: any, key) => acc?.[key], dictionaries[lang]) ?? path
			);
		},
		[lang],
	);

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
					status_key: 'gatekeeper.result.badges.admitted_dirty',
				}));
			}
		}
	}, [currentHash, vm.admitted_hash, vm.ui_state]);

	function updateDraft(patch: Partial<GatekeeperInput>) {
		setVm((prev) => {
			const nextDraft = { ...prev.draft, ...patch };
			const wasAdmitted = prev.ui_state === 'ADMITTED_CLEAN';

			return {
				...prev,
				draft: nextDraft,

				// если уже допущено — любое изменение делает данные "грязными"
				ui_state: wasAdmitted ? 'ADMITTED_DIRTY' : prev.ui_state,
				status_key: wasAdmitted
					? 'gatekeeper.result.badges.admitted_dirty'
					: prev.status_key,

				// при правке — убираем результаты, чтобы не было "ложной уверенности"
				gatekeeper: wasAdmitted ? undefined : prev.gatekeeper,
				ai: wasAdmitted ? undefined : prev.ai,
			};
		});
	}

	async function onPrecheck() {
		setVm((p) => ({
			...p,
			ui_state: 'AI_CHECK_RUNNING',
			status_key: 'gatekeeper.result.badges.checking',
		}));

		const res = await fetch('/api/ai-precheck', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(vm.draft),
		});

		if (!res.ok) {
			setVm((p) => ({
				...p,
				ui_state: 'DRAFT',
				status_key: 'gatekeeper.result.badges.ai_error',
			}));
			return;
		}

		const ai = await res.json();

		// AI hard-stop (пример: нереалистичная/фантастическая цель)
		if (ai?.reality?.verdict === 'BULLSHIT') {
			setVm((p) => ({
				...p,
				ai,
				ui_state: 'AI_HARD_STOP',
				status_key: 'gatekeeper.result.badges.ai_hard_stop',
			}));
			return;
		}

		// Нормализация (AI может отдать normalized поля)
		const canonicalDraft: GatekeeperInput = {
			...vm.draft,
			...ai.normalized,
			responsibility_confirmed: Boolean(vm.draft.responsibility_confirmed),
			production_related: Boolean(vm.draft.production_related),
			mandatory_expenses_included: Boolean(vm.draft.mandatory_expenses_included),
		};

		setVm((p) => ({
			...p,
			ui_state: 'GATEKEEPER_RUNNING',
			status_key: 'gatekeeper.result.badges.gatekeeper_running',
		}));

		const gatekeeper = runGatekeeper(canonicalDraft);

		if (gatekeeper.decision === 'HARD_FAIL') {
			setVm((p) => ({
				...p,
				ai,
				gatekeeper,
				ui_state: 'GATEKEEPER_HARD_FAIL',
				status_key: 'gatekeeper.result.badges.hard_fail',
			}));
			return;
		}

		if (gatekeeper.decision === 'RETURN_WITH_CONDITIONS') {
			setVm((p) => ({
				...p,
				ai,
				gatekeeper,
				ui_state: 'GATEKEEPER_RETURN',
				status_key: 'gatekeeper.result.badges.return_with_conditions',
			}));
			return;
		}

		// ✅ ADMITTED
		const admitted_hash = hashInputForAdmit(canonicalDraft);

		setVm((p) => ({
			...p,
			ai,
			gatekeeper,
			draft: canonicalDraft, // синхронизация после нормализации
			admitted_hash,
			ui_state: 'ADMITTED_CLEAN',
			status_key: 'gatekeeper.result.badges.admitted_clean',
		}));
	}

	const analysisEnabled = vm.ui_state === 'ADMITTED_CLEAN';

	const precheckEnabled =
		vm.ui_state !== 'ADMITTED_CLEAN' &&
		vm.ui_state !== 'AI_CHECK_RUNNING' &&
		vm.ui_state !== 'GATEKEEPER_RUNNING';

	/**
	 * ✅ Clarification list:
	 * - строится из GatekeeperResult.missing_fields + stage
	 * - переводится через i18n ключи (ru/en)
	 *
	 * Ожидаемые ключи:
	 * gatekeeper.result.clarification.title
	 * gatekeeper.result.clarification.items.idea
	 * gatekeeper.result.clarification.items.goal
	 * gatekeeper.result.clarification.items.context
	 * gatekeeper.result.clarification.items.problem
	 * gatekeeper.result.clarification.items.country
	 * gatekeeper.result.clarification.items.region
	 * gatekeeper.result.clarification.items.city
	 * gatekeeper.result.clarification.items.capital
	 * gatekeeper.result.clarification.items.time_horizon
	 * gatekeeper.result.clarification.items.responsibility
	 * gatekeeper.result.clarification.stage.legality
	 * gatekeeper.result.clarification.stage.reality
	 */
	const clarificationItems = useMemo(() => {
		if (!vm.gatekeeper) return [];

		const items: string[] = [];

		const mapFieldToKey = (f: string) => {
			switch (f) {
				case 'idea':
					return 'idea';
				case 'goal':
					return 'goal';
				case 'context':
					return 'context';
				case 'problem':
					return 'problem';
				case 'capital':
					return 'capital';
				case 'time_horizon':
					return 'time_horizon';
				case 'responsibility_confirmed':
					return 'responsibility';
				case 'region.country':
					return 'country';
				case 'region.region':
					return 'region';
				case 'region.city':
					return 'city';
				default:
					return null;
			}
		};

		for (const f of (vm.gatekeeper as any).missing_fields ?? []) {
			const key = mapFieldToKey(String(f));
			if (!key) continue;
			items.push(t(`gatekeeper.result.clarification.items.${key}`));
		}

		// stage-based additions (если хочешь подсказки “над полями”)
		if (vm.gatekeeper.stage === 'LEGALITY') {
			items.push(t('gatekeeper.result.clarification.stage.legality'));
		}
		if (vm.gatekeeper.stage === 'REALITY') {
			items.push(t('gatekeeper.result.clarification.stage.reality'));
		}

		// de-dup
		return Array.from(new Set(items)).filter(Boolean);
	}, [vm.gatekeeper, t]);

	return (
		<main
			style={{
				padding: 24,
				maxWidth: 900,
				margin: '0 auto',
				fontFamily: 'system-ui',
			}}
		>
			<h1>{t('gatekeeper.title')}</h1>

			<div style={{ display: 'flex', gap: 8 }}>
				<button onClick={() => setLang('ru')}>Русский</button>
				<button onClick={() => setLang('en')}>English</button>
			</div>

			{vm.status_key && (
				<div
					style={{
						padding: 12,
						border: '1px solid #ddd',
						borderRadius: 8,
						marginTop: 12,
					}}
				>
					{t(vm.status_key)}
				</div>
			)}

			{/* Gatekeeper result summary */}
			{vm.gatekeeper && (
				<section style={{ marginTop: 16 }}>
					<div
						style={{
							padding: 12,
							borderRadius: 8,
							...getGatekeeperAlertStyle(vm.gatekeeper.decision),
						}}
					>
						<div style={{ fontWeight: 700 }}>{t('gatekeeper.result.title')}</div>

						<div style={{ marginTop: 6 }}>
							{t('gatekeeper.result.labels.decision')}:&nbsp;
							{t(`gatekeeper.result.decision.${vm.gatekeeper.decision}`)}
						</div>

						{Array.isArray((vm.gatekeeper as any).reason_codes) &&
							(vm.gatekeeper as any).reason_codes.length > 0 && (
								<ul style={{ marginTop: 10 }}>
									{(vm.gatekeeper as any).reason_codes.map(
										(rc: string, i: number) => (
											<li key={i}>{rc}</li>
										),
									)}
								</ul>
							)}

						{Array.isArray((vm.gatekeeper as any).reasons) &&
							(vm.gatekeeper as any).reasons.length > 0 && (
								<ul style={{ marginTop: 10 }}>
									{(vm.gatekeeper as any).reasons.map((r: string, i: number) => (
										<li key={i}>{r}</li>
									))}
								</ul>
							)}
					</div>
				</section>
			)}

			{/* ===== FORM (always visible) ===== */}
			<>
				{/* Request Type */}
				<section style={{ marginTop: 16 }}>
					<label>{t('gatekeeper.fields.request_type.label')}</label>
					<div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
						<label>
							<input
								type="radio"
								name="request_type"
								checked={vm.draft.request_type === 'OPPORTUNITY'}
								onChange={() => updateDraft({ request_type: 'OPPORTUNITY' })}
							/>
							{t('gatekeeper.fields.request_type.opportunity')}
						</label>
						<label>
							<input
								type="radio"
								name="request_type"
								checked={vm.draft.request_type === 'PROBLEM_SOLVING'}
								onChange={() =>
									updateDraft({ request_type: 'PROBLEM_SOLVING' })
								}
							/>
							{t('gatekeeper.fields.request_type.problem_solving')}
						</label>
					</div>
				</section>

				{/* Project Type */}
				<section style={{ marginTop: 16 }}>
					<label>{t('gatekeeper.fields.project_type.label')}</label>
					<div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
						<label>
							<input
								type="radio"
								name="project_type"
								checked={vm.draft.project_type === 'OFFLINE'}
								onChange={() => updateDraft({ project_type: 'OFFLINE' })}
							/>
							{t('gatekeeper.fields.project_type.offline')}
						</label>
						<label>
							<input
								type="radio"
								name="project_type"
								checked={vm.draft.project_type === 'ONLINE'}
								onChange={() => updateDraft({ project_type: 'ONLINE' })}
							/>
							{t('gatekeeper.fields.project_type.online')}
						</label>
					</div>
				</section>

				{/* Idea */}
				<section style={{ marginTop: 16 }}>
					<label>{t('gatekeeper.fields.idea.label')}</label>
					<textarea
						value={String(vm.draft.idea ?? '')}
						onChange={(e) => updateDraft({ idea: e.target.value })}
						placeholder={t('gatekeeper.fields.idea.placeholder')}
						style={{ width: '100%', minHeight: 70, marginTop: 6 }}
					/>
				</section>

				{/* Goal */}
				<section style={{ marginTop: 16 }}>
					<label>{t('gatekeeper.fields.goal.label')}</label>
					<textarea
						value={String(vm.draft.goal ?? '')}
						onChange={(e) => updateDraft({ goal: e.target.value })}
						placeholder={t('gatekeeper.fields.goal.placeholder')}
						style={{ width: '100%', minHeight: 70, marginTop: 6 }}
					/>
				</section>

				{/* Context OR Problem */}
				{vm.draft.request_type === 'OPPORTUNITY' ? (
					<section style={{ marginTop: 16 }}>
						<label>{t('gatekeeper.fields.context.label')}</label>
						<textarea
							value={String(vm.draft.context ?? '')}
							onChange={(e) => updateDraft({ context: e.target.value })}
							placeholder={t('gatekeeper.fields.context.placeholder')}
							style={{ width: '100%', minHeight: 70, marginTop: 6 }}
						/>
					</section>
				) : (
					<section style={{ marginTop: 16 }}>
						<label>{t('gatekeeper.fields.problem.label')}</label>
						<textarea
							value={String(vm.draft.problem ?? '')}
							onChange={(e) => updateDraft({ problem: e.target.value })}
							placeholder={t('gatekeeper.fields.problem.placeholder')}
							style={{ width: '100%', minHeight: 80, marginTop: 6 }}
						/>
					</section>
				)}

				{/* Region */}
				<section style={{ marginTop: 16 }}>
					<label>{t('gatekeeper.fields.region.label')}</label>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: 12,
							marginTop: 6,
						}}
					>
						<input
							value={String(vm.draft.region?.country ?? '')}
							onChange={(e) =>
								updateDraft({
									region: { ...vm.draft.region, country: e.target.value },
								})
							}
							placeholder={t('gatekeeper.fields.region_country.placeholder')}
							style={{ height: 36 }}
						/>
						<input
							value={String(vm.draft.region?.region ?? '')}
							onChange={(e) =>
								updateDraft({
									region: { ...vm.draft.region, region: e.target.value },
								})
							}
							placeholder={t('gatekeeper.fields.region_region.placeholder')}
							style={{ height: 36 }}
						/>
					</div>

					<div style={{ marginTop: 12 }}>
						<input
							value={String(vm.draft.region?.city ?? '')}
							onChange={(e) =>
								updateDraft({
									region: { ...vm.draft.region, city: e.target.value },
								})
							}
							placeholder={t('gatekeeper.fields.region_city.placeholder')}
							style={{ width: '100%', height: 36 }}
						/>
						{vm.draft.project_type === 'ONLINE' && (
							<div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
								{t('gatekeeper.fields.region_city.hint_online')}
							</div>
						)}
					</div>
				</section>

				{/* Capital */}
				<section style={{ marginTop: 16 }}>
					<label>{t('gatekeeper.fields.capital.label')}</label>
					<input
						value={String(vm.draft.capital ?? '')}
						onChange={(e) => updateDraft({ capital: e.target.value })}
						placeholder={t('gatekeeper.fields.capital.placeholder')}
						style={{ width: '100%', marginTop: 6, height: 36 }}
					/>
				</section>

				{/* Mandatory expenses */}
				<section style={{ marginTop: 12 }}>
					<label>{t('gatekeeper.fields.mandatory_expenses.label')}</label>
					<div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
						<label>
							<input
								type="radio"
								name="mandatory_expenses_included"
								checked={vm.draft.mandatory_expenses_included === true}
								onChange={() =>
									updateDraft({ mandatory_expenses_included: true })
								}
							/>
							{t('gatekeeper.common.yes')}
						</label>
						<label>
							<input
								type="radio"
								name="mandatory_expenses_included"
								checked={vm.draft.mandatory_expenses_included === false}
								onChange={() =>
									updateDraft({ mandatory_expenses_included: false })
								}
							/>
							{t('gatekeeper.common.no')}
						</label>
					</div>
				</section>

				{/* Time horizon (optional) */}
				<section style={{ marginTop: 16 }}>
					<label>{t('gatekeeper.fields.time_horizon.label')}</label>
					<input
						value={String(vm.draft.time_horizon ?? '')}
						onChange={(e) => updateDraft({ time_horizon: e.target.value })}
						placeholder={t('gatekeeper.fields.time_horizon.placeholder')}
						style={{ width: '100%', marginTop: 6, height: 36 }}
					/>
				</section>

				{/* Responsibility + Production */}
				<section style={{ marginTop: 16, display: 'flex', gap: 16 }}>
					<label>
						<input
							type="checkbox"
							checked={vm.draft.responsibility_confirmed}
							onChange={(e) =>
								updateDraft({ responsibility_confirmed: e.target.checked })
							}
						/>
						{t('gatekeeper.checkboxes.responsibility')}
					</label>

					<label>
						<input
							type="checkbox"
							checked={vm.draft.production_related}
							onChange={(e) =>
								updateDraft({ production_related: e.target.checked })
							}
						/>
						{t('gatekeeper.checkboxes.production')}
					</label>
				</section>
			</>

			{/* Actions */}
			<section style={{ marginTop: 20, display: 'flex', gap: 12 }}>
				<button
					disabled={!precheckEnabled}
					onClick={onPrecheck}
					style={{
						height: 40,
						padding: '0 14px',
						color: '#fff',
						background: precheckEnabled ? '#111' : '#bbb',
						border: 'none',
						borderRadius: 6,
						cursor: precheckEnabled ? 'pointer' : 'not-allowed',
						opacity: precheckEnabled ? 1 : 0.9,
					}}
				>
					{t('gatekeeper.buttons.precheck')}
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
					{t('gatekeeper.buttons.analysis')}
				</button>
			</section>

			{vm.ui_state === 'ADMITTED_CLEAN' && (
				<div style={{ marginTop: 10, color: '#444' }}>
					{t('gatekeeper.result.badges.admitted_clean')}
				</div>
			)}

			{vm.ui_state === 'ADMITTED_DIRTY' && (
				<div style={{ marginTop: 10, color: '#444' }}>
					{t('gatekeeper.result.badges.admitted_dirty')}
				</div>
			)}

			{/* ✅ Clarification (translated, lower block) */}
			{clarificationItems.length > 0 && (
				<section style={{ marginTop: 24 }}>
					<h3>{t('gatekeeper.result.clarification.title')}</h3>
					<ul>
						{clarificationItems.map((q, i) => (
							<li key={i}>{q}</li>
						))}
					</ul>
				</section>
			)}

			{vm.ai && (
				<section style={{ marginTop: 24 }}>
					<h3>{t('gatekeeper.result.sections.ai')}</h3>
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