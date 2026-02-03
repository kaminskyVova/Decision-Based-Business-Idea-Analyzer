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
				cta: 'Go to clarification',

				items: {
					idea: 'Clarify the idea: what exactly are we launching / validating? (min 10–15 chars)',
					goal: 'Make the goal more specific: what counts as success and by when.',
					context:
						'Add context: why now, what is the rationale (demand/seasonality/resources/location).',
					problem:
						'Describe the problem concretely: what fails, where the loss is, 1–2 examples.',
					country: 'Specify the country (required).',
					region: 'Specify the region/state (required).',
					city: 'Specify the city (required for offline projects).',
					capital:
						'Provide capital as a number or range (e.g. 100000 / up to 200000 / 100k).',
					time_horizon:
						'Provide a time horizon (e.g. 2 weeks / 1 month / 6 months).',
					responsibility:
						'Confirm responsibility via checkbox — analysis is blocked without it.',
				},
				readability: {
					idea: 'The “Idea” field contains unreadable or meaningless text.',
					goal: 'The “Goal” field contains unreadable or meaningless text.',
					context:
						'The “Context” field contains unreadable or meaningless text.',
					problem:
						'The “Problem” field contains unreadable or meaningless text.',
					time_horizon:
						'The “Time horizon” field contains unreadable or invalid text.',
					region: {
						country: 'The “Country” field contains unreadable or invalid text.',
						region: 'The “Region” field contains unreadable or invalid text.',
						city: 'The “City” field contains unreadable or invalid text.',
					},
				},

				stage: {
					legality:
						'Remove any hints of bypassing the law. The case must be legal.',
					reality:
						'Remove unrealistic expectations: the goal must be achievable with the given time and resources.',
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
		reason_codes: {
			'RC-01': {
				title: 'Missing or invalid input data',
				description:
					'Core fields (idea/context/region, etc.) are missing or invalid.',
			},
			'RC-02': {
				title: 'Goal is undefined or not measurable',
				description:
					'Goal is phrased as a wish or has no measurable success criteria.',
			},
			'RC-03': {
				title: 'Responsibility not confirmed',
				description: 'User did not confirm they are responsible for decisions.',
			},
			'RC-04': {
				title: 'Contradicts reality constraints',
				description: 'Inputs conflict with basic real-world constraints.',
			},
			'RC-05': {
				title: 'Legality issue',
				description:
					'Indicators of illegal activity or attempts to bypass requirements.',
			},
			'RC-06': {
				title: 'Attempt to push the system',
				description:
					'Repeated attempts without updating inputs or bypassing the process.',
			},
			'RC-07': {
				title: 'Capital missing or invalid',
				description: 'Capital is missing or cannot be parsed/understood.',
			},
			'RC-08': {
				title: 'Out of scope',
				description:
					'Request is not related to strict idea evaluation or problem solving.',
			},
			'RC-09': {
				title: 'Resource mismatch',
				description:
					'For production cases, resources do not match the stated goal.',
			},
		},
	},
};
