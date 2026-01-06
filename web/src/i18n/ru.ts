export const ru = {
	gatekeeper: {
		title: 'Анализатор бизнес-идей на основе принятия решений',

		fields: {
			problem: {
				label: 'Проблема',
				placeholder: 'Что не работает сейчас? Контекст / пример.',
			},
			goal: {
				label: 'Цель',
				placeholder:
					'Цель обращения: проверить целесообразность / актуальность или получить конкретный результат.',
			},
			region: {
				label: 'Регион',
				placeholder: 'Страна + регион (+город для оффлайн).',
			},
			capital: {
				label: 'Капитал',
				placeholder: 'Например: 100000 / до 200000 / 100k',
			},
			time_horizon: {
				label: 'Временные рамки',
				placeholder:
					'Опционально для допуска, но может помочь (напр.: 3 месяца)',
			},
		},

		checkboxes: {
			responsibility: 'Я принимаю решения сам (обязательно)',
			production: 'Производственный кейс',
			mandatory_expenses: 'Учтены обязательные расходы(Аренда/Зарплата/Налоги и тд.)?',
		},

		buttons: {
			precheck: 'Проверка данных',
			analysis: 'Анализ',
		},

		states: {
			admitted: 'Данные готовы (ADMITTED). Анализ доступен.',
			dirty: 'Данные изменены — требуется повторная проверка.',
			need_check: 'Сначала нажмите «Проверка данных».',
		},
		result: {
			notes: {
				ADMITTED: 'Gatekeeper v1 пройден. Анализ доступен.',
				RETURN_WITH_CONDITIONS:
					'Требуется уточнение. Пожалуйста, обновите поля ниже.',
				HARD_FAIL: 'Отклонено. Исправьте входные данные и попробуйте снова.',
			},
			decision: {
				ADMITTED: 'Допуск получен (ADMITTED)',
				RETURN_WITH_CONDITIONS: 'Нужны уточнения (RETURN)',
				HARD_FAIL: 'Отклонено (HARD FAIL)',
			},
			badges: {
				admitted_clean: 'Данные готовы. Анализ доступен.',
				admitted_dirty: 'Данные изменены — требуется повторная проверка.',
				need_check: 'Сначала нажмите «Проверка данных».',
				checking: 'Проверка данных…',
				gatekeeper_running: 'Gatekeeper…',
				ai_error: 'Ошибка проверки данных. Повторите.',
			},
			sections: {
				clarification: 'Уточнения',
				gatekeeper: 'Результат Gatekeeper',
				ai: 'AI precheck',
			},
		},
	},
};
