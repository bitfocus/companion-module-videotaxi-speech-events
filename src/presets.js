import { COLORS } from './constants.js'

export function UpdatePresets(self) {
	const C_WHITE = COLORS.white
	const C_GREEN = COLORS.green
	const C_RED = COLORS.red
	const C_DARK = COLORS.dark

	// Connection label used in preset button text (variable references). Uses the
	// live label so a renamed connection keeps working.
	const label = self.label

	const preset = (name, text, actionId, options, feedbacks, size) => ({
		type: 'simple',
		name,
		style: { text, size: size || '18', color: C_WHITE, bgcolor: C_DARK },
		steps: [{ down: [{ actionId, options: options || {} }], up: [] }],
		feedbacks: feedbacks || [],
	})

	const langPreset = (buttonLabel, code) =>
		preset(
			`Input language ${buttonLabel} (green when active)`,
			buttonLabel,
			'set_input_language',
			{ lang: code },
			[{ feedbackId: 'language_is', options: { lang: code }, style: { bgcolor: C_GREEN, color: C_WHITE } }],
			'24',
		)

	// Toggle preset for a fullscreen switch of the active session (green = on).
	const viewerTogglePreset = (name, text, actionId, feedbackId) =>
		preset(
			name,
			text,
			actionId,
			{ session: '', value: 'toggle' },
			[{ feedbackId, options: {}, style: { bgcolor: C_GREEN, color: C_WHITE } }],
			'14',
		)

	const presets = {
		start_green: preset('Start (green when active)', 'START', 'send_start', {}, [
			{ feedbackId: 'sending', options: {}, style: { bgcolor: C_GREEN, color: C_WHITE } },
		]),
		// Stop feedback inverted: red while stopped, so Start and Stop do not both
		// react in the started state.
		stop_red: preset('Stop (red when stopped)', 'STOP', 'send_stop', {}, [
			{ feedbackId: 'sending', options: {}, isInverted: true, style: { bgcolor: C_RED, color: C_WHITE } },
		]),
		// Toggle: feedback also sets the button text (sending → "Stop", else → "Start").
		toggle_send: preset('Start/stop (green "Stop" / red "Start")', 'Start', 'toggle_send', {}, [
			{ feedbackId: 'sending', options: {}, style: { bgcolor: C_GREEN, color: C_WHITE, text: 'Stop' } },
			{
				feedbackId: 'sending',
				options: {},
				isInverted: true,
				style: { bgcolor: C_RED, color: C_WHITE, text: 'Start' },
			},
		]),
		open_fullscreen: preset('Open transcript fullscreen', 'FULLSCREEN', 'open_fullscreen', { session: '' }),
		close_fullscreen: preset('Close transcript fullscreen', 'CLOSE\nFULLSCREEN', 'close_fullscreen', {}, [], '14'),
		// Toggle on one button; green + text "CLOSE" when the fullscreen is open.
		toggle_fullscreen: preset(
			'Open/close fullscreen',
			'OPEN\nFULLSCREEN',
			'toggle_fullscreen',
			{ session: '' },
			[
				{
					feedbackId: 'fullscreen_open',
					options: {},
					style: { bgcolor: C_GREEN, color: C_WHITE, text: 'CLOSE\nFULLSCREEN' },
				},
			],
			'14',
		),

		lang_de: langPreset('DE', 'de-DE'),
		lang_en: langPreset('EN', 'en-GB'),
		lang_es: langPreset('ES', 'es-ES'),
		lang_fr: langPreset('FR', 'fr-FR'),
		lang_it: langPreset('IT', 'it-IT'),

		// ▲ shows only the "Language" label, ▼ shows the current language.
		lang_next_preset: preset('Next language (▲ "Language")', '▲\nLanguage', 'lang_next', {}, [], '14'),
		lang_prev_preset: preset(
			'Previous language (▼ shows current)',
			`▼\n$(${label}:language)`,
			'lang_prev',
			{},
			[],
			'14',
		),

		// ▲ shows only the "Zoom" label, ▼ shows the current zoom factor.
		zoom_next_preset: preset('Zoom + (▲ "Zoom")', '▲\nZoom', 'zoom_next', {}, [], '14'),
		zoom_prev_preset: preset('Zoom − (▼ shows current)', `▼\n$(${label}:zoom)`, 'zoom_prev', {}, [], '14'),

		// Toggle presets for the fullscreen switches (active session). Green = on.
		voiceover_toggle: viewerTogglePreset('Toggle audio translation', 'AUDIO', 'set_viewer_voiceover', 'voiceover_on'),
		original_toggle: viewerTogglePreset('Toggle source language', 'ORIGINAL', 'set_viewer_original', 'original_on'),
		qr_toggle: viewerTogglePreset('Toggle QR code', 'QR', 'set_viewer_qr', 'qr_on'),
		info_toggle: viewerTogglePreset('Toggle event info link', 'INFO', 'set_viewer_info', 'info_on'),

		// Toggle text direction; button shows the current direction (▲ bottom→top / ▼ top→bottom).
		direction_toggle: preset(
			'Toggle text direction (shows current)',
			'DIRECTION',
			'set_viewer_direction',
			{ session: '', dir: 'toggle' },
			[
				{
					feedbackId: 'direction_is',
					options: { dir: 'btt' },
					style: { bgcolor: C_GREEN, color: C_WHITE, text: '▲\nbottom→top' },
				},
				{
					feedbackId: 'direction_is',
					options: { dir: 'ttb' },
					style: { bgcolor: C_GREEN, color: C_WHITE, text: '▼\ntop→bottom' },
				},
			],
			'14',
		),
	}

	const structure = [
		{
			id: 'sending',
			name: 'Sending',
			definitions: [
				'start_green',
				'stop_red',
				'toggle_send',
				'open_fullscreen',
				'close_fullscreen',
				'toggle_fullscreen',
			],
		},
		{
			id: 'languages',
			name: 'Input languages',
			definitions: ['lang_de', 'lang_en', 'lang_es', 'lang_fr', 'lang_it', 'lang_next_preset', 'lang_prev_preset'],
		},
		{ id: 'zoom', name: 'Zoom', definitions: ['zoom_next_preset', 'zoom_prev_preset'] },
		{
			id: 'fullscreen',
			name: 'Fullscreen switches',
			definitions: ['voiceover_toggle', 'original_toggle', 'qr_toggle', 'info_toggle', 'direction_toggle'],
		},
	]

	self.setPresetDefinitions(structure, presets)
}
