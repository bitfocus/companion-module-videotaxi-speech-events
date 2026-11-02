import { COLORS } from './constants.js'

export function UpdateFeedbacks(self) {
	const C_WHITE = COLORS.white
	const C_GREEN = COLORS.green
	const C_RED = COLORS.red
	const C_DARK = COLORS.dark
	const langDefault = self.languages[0]?.code || 'de-DE'

	self.setFeedbackDefinitions({
		sending: {
			type: 'boolean',
			name: 'Currently sending',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [],
			callback: () => self.state.sending === true,
		},
		is_error: {
			type: 'boolean',
			name: 'Error',
			defaultStyle: { bgcolor: C_RED, color: C_WHITE },
			options: [],
			callback: () => self.state.status === 'error',
		},
		ext_connected: {
			type: 'boolean',
			name: 'Extension connected',
			defaultStyle: { bgcolor: C_DARK, color: C_WHITE },
			options: [],
			callback: () => self.state.connected === true,
		},
		language_is: {
			type: 'boolean',
			name: 'Input language is …',
			description: 'Green when the current input language matches (exact code or prefix such as "de").',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [
				{
					type: 'dropdown',
					id: 'lang',
					label: 'Language',
					default: langDefault,
					choices: self.langChoices(),
					allowCustom: true,
				},
			],
			callback: (fb) => self.languageMatches(fb.options.lang),
		},
		session_is: {
			type: 'boolean',
			name: 'Session is … (delivery)',
			description: 'Green when the active delivery session matches.',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [
				{
					type: 'dropdown',
					id: 'session',
					label: 'Session',
					default: self.sessions[0]?.id || '',
					choices: self.sessionChoices(),
					allowCustom: true,
				},
			],
			callback: (fb) => String(self.state.session || '') === String(fb.options.session || ''),
		},
		viewer_language_is: {
			type: 'boolean',
			name: 'Fullscreen display language is …',
			description: 'Green when the display language of the active session matches ("" = source language).',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [
				{
					type: 'dropdown',
					id: 'lang',
					label: 'Display language',
					default: '',
					choices: self.viewerLangChoices(),
					allowCustom: true,
				},
			],
			callback: (fb) => String(self.state.viewerLanguage || '') === String(fb.options.lang || ''),
		},
		direction_is: {
			type: 'boolean',
			name: 'Fullscreen text direction is …',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [
				{
					type: 'dropdown',
					id: 'dir',
					label: 'Text direction',
					default: 'btt',
					disableAutoExpression: true,
					choices: [
						{ id: 'btt', label: 'Bottom to top' },
						{ id: 'ttb', label: 'Top to bottom' },
					],
				},
			],
			callback: (fb) => String(self.state.direction || '') === String(fb.options.dir),
		},
		zoom_is: {
			type: 'boolean',
			name: 'Fullscreen zoom is …',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [
				{
					type: 'dropdown',
					id: 'zoom',
					label: 'Zoom',
					default: '1',
					choices: [
						{ id: '1', label: '100 %' },
						{ id: '1.25', label: '125 %' },
						{ id: '1.5', label: '150 %' },
						{ id: '1.75', label: '175 %' },
						{ id: '2', label: '200 %' },
						{ id: '2.5', label: '250 %' },
						{ id: '3', label: '300 %' },
					],
				},
			],
			callback: (fb) => String(self.state.zoom) === String(fb.options.zoom),
		},
		voiceover_on: {
			type: 'boolean',
			name: 'Fullscreen: audio translation on',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [],
			callback: () => self.state.voiceover === true,
		},
		original_on: {
			type: 'boolean',
			name: 'Fullscreen: source language on',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [],
			callback: () => self.state.showOriginal === true,
		},
		qr_on: {
			type: 'boolean',
			name: 'Fullscreen: QR code on',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [],
			callback: () => self.state.showQrCode === true,
		},
		info_on: {
			type: 'boolean',
			name: 'Fullscreen: event info link on',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [],
			callback: () => self.state.showInfoButton === true,
		},
		display_is: {
			type: 'boolean',
			name: 'Fullscreen monitor is …',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [
				{
					type: 'dropdown',
					id: 'display',
					label: 'Monitor',
					default: '',
					choices: self.displayChoices(),
					allowCustom: true,
				},
			],
			callback: (fb) => String(self.state.display || '') === String(fb.options.display || ''),
		},
		fullscreen_open: {
			type: 'boolean',
			name: 'Transcript fullscreen open',
			defaultStyle: { bgcolor: C_GREEN, color: C_WHITE },
			options: [],
			callback: () => self.state.fullscreen === true,
		},
	})
}
