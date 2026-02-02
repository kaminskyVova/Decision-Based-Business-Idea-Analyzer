export const en = {
	gatekeeper: {
		title: 'Decision-Based Business Idea Analyzer',

		common: {
			yes: 'Yes',
			no: 'No',
		},

		fields: {
			request_type: {
				label: 'Request type',
				opportunity: 'Opportunity evaluation',
				problem_solving: 'Problem solving',
			},

			project_type: {
				label: 'Project type',
				offline: 'Offline (physical business)',
				online: 'Online (digital / remote)',
			},

			idea: {
				label: 'Idea',
				placeholder: 'Briefly describe the business idea or initiative.',
			},

			goal: {
				label: 'Goal',
				placeholder:
					'Purpose of the request: validate feasibility / relevance or reach a specific outcome.',
			},

			context: {
				label: 'Context / Rationale',
				placeholder:
					'Why this idea is considered: market situation, experience, access to resources, seasonality, etc.',
			},

			problem: {
				label: 'Problem',
				placeholder: 'What is not working now? Real context / example.',
			},

			region: {
				label: 'Region',
			},

			region_country: {
				placeholder: 'Country',
			},

			region_region: {
				placeholder: 'Region / state',
			},

			region_city: {
				placeholder: 'City',
				hint_online:
					'City is optional for online projects, but country and region are still required.',
			},

			capital: {
				label: 'Capital',
				placeholder: 'Example: 100000 / up to 200000 / 100k',
			},

			mandatory_expenses: {
				label:
					'Have mandatory expenses been included in the starting capital (rent, payroll, taxes, etc)?',
			},

			time_horizon: {
				label: 'Time horizon',
				placeholder: 'Optional for admission (e.g. 3 months)',
			},
		},

		checkboxes: {
			responsibility: 'I take responsibility for decisions (required)',
			production: 'Production / manufacturing case',
		},

		buttons: {
			precheck: 'Data check',
			analysis: 'Analysis',
		},

		result: {
			clarification: {
				title: 'Clarification',
				items: {
					idea: 'Clarify the Idea field. Describe the idea meaningfully (not placeholders or random input).',
					goal: 'Formulate the goal in a measurable way: metric + timeframe (min. 10 characters).',
					context:
						'Clarify the Context field. Explain why this opportunity/problem exists.',
					problem:
						'Clarify the Problem field. Describe what is not working, where losses occur, with 1–2 examples.',
					country: 'Clarify the Country field.',
					region: 'Clarify the Region field.',
					city: 'Clarify the City field.',
					capital:
						'Specify the capital: number / range / shorthand (e.g. 100000, up to 200000, 100k).',
					responsibility:
						'Confirm responsibility by checking the checkbox — without this, execution is blocked.',
				},
			},

			title: 'Gatekeeper Result',

			labels: {
				decision: 'Decision',
			},
			decision: {
				ADMITTED: 'Admitted (ADMITTED)',
				RETURN_WITH_CONDITIONS: 'Clarification required (RETURN)',
				HARD_FAIL: 'Rejected (HARD FAIL)',
			},

			badges: {
				admitted_clean: 'Data ready. Analysis enabled.',
				admitted_dirty: 'Data changed — recheck required.',
				need_check: 'Please run data check first.',
				checking: 'Checking data…',
				gatekeeper_running: 'Gatekeeper running…',
				ai_error: 'Data check failed. Try again.',
				return_with_conditions: 'Clarification required — recheck needed',
			},

			sections: {
				clarification: 'Clarification',
				gatekeeper: 'Gatekeeper result',
				ai: 'AI precheck',
			},
		},
	},
};
