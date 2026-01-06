export const en = {
	gatekeeper: {
		title: 'Decision-Based Business Idea Analyzer',

		fields: {
			problem: {
				label: 'Problem',
				placeholder: 'What is not working now? Context / example.',
			},
			goal: {
				label: 'Goal',
				placeholder:
					'Purpose of the request: validate feasibility/relevance or achieve a specific outcome.',
			},
			region: {
				label: 'Region',
				placeholder: 'Country + region (+city for offline cases).',
			},
			capital: {
				label: 'Capital',
				placeholder: 'Example: 100000 / up to 200000 / 100k',
			},
			time_horizon: {
				label: 'Time horizon',
				placeholder: 'Optional for admission, but may help (e.g. 3 months)',
			},
		},

		checkboxes: {
			responsibility: 'I take responsibility for decisions (required)',
			production: 'Production case',
			mandatory_expenses:
				'Have mandatory expenses been included in the starting capital(Rent/Payroll/Taxes/etc)?',
		},

		buttons: {
			precheck: 'Data check',
			analysis: 'Analysis',
		},

		states: {
			admitted: 'Data ready (ADMITTED). Analysis enabled.',
			dirty: 'Data changed — recheck required.',
			need_check: 'Please run data check first.',
		},
		result: {
			notes: {
				ADMITTED: 'Gatekeeper v1 passed. Analysis is enabled.',
				RETURN_WITH_CONDITIONS:
					'Clarification required. Please update the fields below.',
				HARD_FAIL: 'Rejected. Fix the inputs and try again.',
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
				gatekeeper_running: 'Gatekeeper…',
				ai_error: 'Data check failed. Try again.',
			},
			sections: {
				clarification: 'Clarification',
				gatekeeper: 'Gatekeeper result',
				ai: 'AI precheck',
			},
		},
	},
};
