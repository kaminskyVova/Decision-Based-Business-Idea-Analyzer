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

type GatekeeperDecision = 'ADMITTED' | 'RETURN_WITH_CONDITIONS' | 'HARD_FAIL';
type AiVerdict = 'OK' | 'NEEDS_CLARIFICATION' | 'BLOCK';

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

			const wasChecked = Boolean(prev.gatekeeper || prev.ai || prev.admitted_hash);

			return {
				...prev,
				draft: nextDraft,

				ui_state: wasChecked ? 'ADMITTED_DIRTY' : prev.ui_state,
				status_key: wasChecked
					? 'gatekeeper.result.badges.admitted_dirty'
					: prev.status_key,

				// при правке — сбрасываем результаты
				gatekeeper: wasChecked ? undefined : prev.gatekeeper,
				ai: wasChecked ? undefined : prev.ai,
			};
		});
	}

	function combineVerdicts(
		aiVerdict: AiVerdict | undefined,
		gatekeeperDecision: GatekeeperDecision | undefined,
	): GatekeeperDecision {
		// 1) Gatekeeper HARD_FAIL всегда побеждает
		if (gatekeeperDecision === 'HARD_FAIL') return 'HARD_FAIL';

		// 2) AI BLOCK = жесткий стоп
		if (aiVerdict === 'BLOCK') return 'HARD_FAIL';

		// 3) Любые "условия/уточнения" => RETURN_WITH_CONDITIONS
		if (gatekeeperDecision === 'RETURN_WITH_CONDITIONS')
			return 'RETURN_WITH_CONDITIONS';
		if (aiVerdict === 'NEEDS_CLARIFICATION') return 'RETURN_WITH_CONDITIONS';

		// 4) Иначе допуск
		return 'ADMITTED';
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

		const finalDecision = combineVerdicts(ai?.verdict, gatekeeper.decision);
		const mergedGatekeeper = { ...gatekeeper, decision: finalDecision };

		if (finalDecision === 'HARD_FAIL') {
			setVm((p) => ({
				...p,
				ai,
				gatekeeper: mergedGatekeeper,
				ui_state: 'GATEKEEPER_HARD_FAIL',
				status_key: 'gatekeeper.result.badges.hard_fail',
			}));
			return;
		}

		if (finalDecision === 'RETURN_WITH_CONDITIONS') {
			setVm((p) => ({
				...p,
				ai,
				gatekeeper: mergedGatekeeper,
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
			gatekeeper: mergedGatekeeper,
			draft: canonicalDraft,
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

	// ===== safe reason_codes =====
	const reasonCodes: string[] = useMemo(() => {
		const arr = (vm.gatekeeper as any)?.reason_codes;
		return Array.isArray(arr) ? arr.map((x: any) => String(x)) : [];
	}, [vm.gatekeeper]);

	/**
	 * Clarification list (i18n)
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

		const missing = (vm.gatekeeper as any)?.missing_fields;
		const missingArr: string[] = Array.isArray(missing)
			? missing.map((x: any) => String(x))
			: [];

		for (const f of missingArr) {
			const key = mapFieldToKey(f);
			if (!key) continue;
			items.push(t(`gatekeeper.result.clarification.items.${key}`));
		}

		if (vm.gatekeeper.stage === 'LEGALITY') {
			items.push(t('gatekeeper.result.clarification.stage.legality'));
		}
		if (vm.gatekeeper.stage === 'REALITY') {
			items.push(t('gatekeeper.result.clarification.stage.reality'));
		}

		return Array.from(new Set(items)).filter(Boolean);
	}, [vm.gatekeeper, t]);

	// ===== UX: field highlight from missing_fields =====
	const missingSet = useMemo(() => {
		const arr = (vm.gatekeeper as any)?.missing_fields;
		const safeArr: string[] = Array.isArray(arr) ? arr.map((x: any) => String(x)) : [];
		return new Set(safeArr);
	}, [vm.gatekeeper]);

	const isMissing = useCallback(
		(key: string) => vm.ui_state === 'GATEKEEPER_RETURN' && missingSet.has(key),
		[missingSet, vm.ui_state],
	);

	const labelStyle = useCallback(
		(key: string) => ({
			fontWeight: isMissing(key) ? 700 : 400,
			color: isMissing(key) ? '#7a5200' : '#111',
		}),
		[isMissing],
	);

	const controlBorder = useCallback(
		(key: string) => (isMissing(key) ? '2px solid #ffb300' : '1px solid #ccc'),
		[isMissing],
	);

	const textareaStyle = useCallback(
		(key: string) => ({
			width: '100%',
			minHeight: 70,
			marginTop: 6,
			padding: 10,
			borderRadius: 6,
			border: controlBorder(key),
			outline: 'none',
		}),
		[controlBorder],
	);

	const inputStyle = useCallback(
		(key: string) => ({
			height: 36,
			padding: '0 10px',
			borderRadius: 6,
			border: controlBorder(key),
			outline: 'none',
		}),
		[controlBorder],
	);

	const scrollToClarification = useCallback(() => {
		document.getElementById('clarification')?.scrollIntoView({ behavior: 'smooth' });
	}, []);

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
						backgroundColor: '#f0cf4e',
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

						{vm.ui_state === 'GATEKEEPER_RETURN' && clarificationItems.length > 0 && (
							<div style={{ marginTop: 10 }}>
								<button
									type="button"
									onClick={scrollToClarification}
									style={{
										height: 34,
										padding: '0 10px',
										borderRadius: 6,
										border: '1px solid #ffb300',
										background: '#ed900f',
										cursor: 'pointer',
									}}
								>
									{t('gatekeeper.result.clarification.cta')}
								</button>
							</div>
						)}

						{reasonCodes.length > 0 && (
							<ul style={{ marginTop: 10, paddingLeft: 18 }}>
								{reasonCodes.map((rc: string, i: number) => (
									<li key={i} style={{ marginBottom: 6 }}>
										<div>
											<strong>{rc}</strong>
											{' — '}
											{t(`gatekeeper.reason_codes.${rc}.title`)}
										</div>
										<div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
											{t(`gatekeeper.reason_codes.${rc}.description`)}
										</div>
									</li>
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
								onChange={() => updateDraft({ request_type: 'PROBLEM_SOLVING' })}
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
					<label style={labelStyle('idea')}>{t('gatekeeper.fields.idea.label')}</label>
					<textarea
						value={String(vm.draft.idea ?? '')}
						onChange={(e) => updateDraft({ idea: e.target.value })}
						placeholder={t('gatekeeper.fields.idea.placeholder')}
						style={{ ...textareaStyle('idea'), minHeight: 70 }}
					/>
				</section>

				{/* Goal */}
				<section style={{ marginTop: 16 }}>
					<label style={labelStyle('goal')}>{t('gatekeeper.fields.goal.label')}</label>
					<textarea
						value={String(vm.draft.goal ?? '')}
						onChange={(e) => updateDraft({ goal: e.target.value })}
						placeholder={t('gatekeeper.fields.goal.placeholder')}
						style={{ ...textareaStyle('goal'), minHeight: 70 }}
					/>
				</section>

				{/* Context OR Problem */}
				{vm.draft.request_type === 'OPPORTUNITY' ? (
					<section style={{ marginTop: 16 }}>
						<label style={labelStyle('context')}>{t('gatekeeper.fields.context.label')}</label>
						<textarea
							value={String(vm.draft.context ?? '')}
							onChange={(e) => updateDraft({ context: e.target.value })}
							placeholder={t('gatekeeper.fields.context.placeholder')}
							style={{ ...textareaStyle('context'), minHeight: 70 }}
						/>
					</section>
				) : (
					<section style={{ marginTop: 16 }}>
						<label style={labelStyle('problem')}>{t('gatekeeper.fields.problem.label')}</label>
						<textarea
							value={String(vm.draft.problem ?? '')}
							onChange={(e) => updateDraft({ problem: e.target.value })}
							placeholder={t('gatekeeper.fields.problem.placeholder')}
							style={{ ...textareaStyle('problem'), minHeight: 80 }}
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
							style={inputStyle('region.country')}
						/>
						<input
							value={String(vm.draft.region?.region ?? '')}
							onChange={(e) =>
								updateDraft({
									region: { ...vm.draft.region, region: e.target.value },
								})
							}
							placeholder={t('gatekeeper.fields.region_region.placeholder')}
							style={inputStyle('region.region')}
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
							style={{ ...inputStyle('region.city'), width: '100%' }}
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
					<label style={labelStyle('capital')}>{t('gatekeeper.fields.capital.label')}</label>
					<input
						value={String(vm.draft.capital ?? '')}
						onChange={(e) => updateDraft({ capital: e.target.value })}
						placeholder={t('gatekeeper.fields.capital.placeholder')}
						style={{ ...inputStyle('capital'), width: '100%', marginTop: 6 }}
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
								onChange={() => updateDraft({ mandatory_expenses_included: true })}
							/>
							{t('gatekeeper.common.yes')}
						</label>
						<label>
							<input
								type="radio"
								name="mandatory_expenses_included"
								checked={vm.draft.mandatory_expenses_included === false}
								onChange={() => updateDraft({ mandatory_expenses_included: false })}
							/>
							{t('gatekeeper.common.no')}
						</label>
					</div>
				</section>

				{/* Time horizon (optional) */}
				<section style={{ marginTop: 16 }}>
					<label style={labelStyle('time_horizon')}>
						{t('gatekeeper.fields.time_horizon.label')}
					</label>
					<input
						value={String(vm.draft.time_horizon ?? '')}
						onChange={(e) => updateDraft({ time_horizon: e.target.value })}
						placeholder={t('gatekeeper.fields.time_horizon.placeholder')}
						style={{ ...inputStyle('time_horizon'), width: '100%', marginTop: 6 }}
					/>
				</section>

				{/* Responsibility + Production */}
				<section style={{ marginTop: 16, display: 'flex', gap: 16 }}>
					<label style={labelStyle('responsibility_confirmed')}>
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
							onChange={(e) => updateDraft({ production_related: e.target.checked })}
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

			{/* Clarification alert under form (anchor) */}
			{vm.ui_state === 'GATEKEEPER_RETURN' && clarificationItems.length > 0 && (
				<section id="clarification" style={{ marginTop: 16 }}>
					<div
						style={{
							padding: 12,
							borderRadius: 8,
							border: '1px solid #ffb300',
							background: '#fff8e1',
							color: '#7a5200',
						}}
					>
						<div style={{ fontWeight: 700, marginBottom: 6 }}>
							{t('gatekeeper.result.sections.clarification')}
						</div>
						<ul style={{ margin: 0, paddingLeft: 18 }}>
							{clarificationItems.map((q, i) => (
								<li key={i}>{q}</li>
							))}
						</ul>
					</div>
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