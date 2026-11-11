export function UpdateActions(self) {
	const cmd = (action) => ({ options: [], callback: () => self.sendCmd(action) })
	const langDefault = self.languages[0]?.code || 'de-DE'
	const sessionDefault = self.sessions[0]?.id || ''
	const sess = () => ({
		type: 'dropdown',
		id: 'session',
		label: 'Session',
		default: '',
		choices: self.viewerSessionChoices(),
		allowCustom: true,
	})
	const ONOFF = [
		{ id: 'true', label: 'On' },
		{ id: 'false', label: 'Off' },
		{ id: 'toggle', label: 'Toggle' },
	]
	// Set action for a fullscreen switch (session + on/off).
	const viewerToggle = (name, action) => ({
		name,
		options: [
			sess(),
			{ type: 'dropdown', id: 'value', label: 'State', default: 'true', choices: ONOFF, disableAutoExpression: true },
		],
		callback: (ev) => self.sendCmdFields(action, { session: ev.options.session, value: ev.options.value }),
	})

	self.setActionDefinitions({
		toggle_send: { name: 'Send start/stop', ...cmd('toggleSend') },
		send_start: { name: 'Start sending', ...cmd('sendStart') },
		send_stop: { name: 'Stop sending', ...cmd('sendStop') },
		lang_next: { name: 'Next input language', ...cmd('langNext') },
		lang_prev: { name: 'Previous input language', ...cmd('langPrev') },
		set_input_language: {
			name: 'Select input language',
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
			callback: (ev) => self.sendCmd('setLanguage', ev.options.lang),
		},
		set_language_and_restart: {
			name: 'Select input language and restart sending',
			description:
				'Stops sending, switches the input language, then starts again — with a short pause so the ' +
				'extension can apply the change. Lets one button do what the layout buttons do in a single step.',
			options: [
				{
					type: 'dropdown',
					id: 'lang',
					label: 'Language',
					default: langDefault,
					choices: self.langChoices(),
					allowCustom: true,
				},
				{
					type: 'number',
					id: 'delay',
					label: 'Pause before and after (ms)',
					default: 500,
					min: 0,
					max: 10000,
				},
			],
			callback: async (ev) => {
				const delay = Math.max(0, Math.min(10000, Number(ev.options.delay) || 0))
				const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
				self.sendCmd('sendStop')
				if (delay) await wait(delay)
				self.sendCmd('setLanguage', ev.options.lang)
				if (delay) await wait(delay)
				self.sendCmd('sendStart')
			},
		},
		set_session: {
			name: 'Select session (delivery)',
			options: [
				{
					type: 'dropdown',
					id: 'session',
					label: 'Session',
					default: sessionDefault,
					choices: self.sessionChoices(),
					allowCustom: true,
				},
			],
			callback: (ev) => self.sendCmd('setSession', ev.options.session),
		},
		zoom_next: {
			name: 'Browser zoom + (session)',
			options: [sess()],
			callback: (ev) => self.sendCmdFields('zoomNext', { session: ev.options.session }),
		},
		zoom_prev: {
			name: 'Browser zoom − (session)',
			options: [sess()],
			callback: (ev) => self.sendCmdFields('zoomPrev', { session: ev.options.session }),
		},

		// --- Fullscreen settings per session ---
		set_viewer_language: {
			name: 'Fullscreen: set display language',
			options: [
				sess(),
				{
					type: 'dropdown',
					id: 'lang',
					label: 'Display language',
					default: '',
					choices: self.viewerLangChoices(),
					allowCustom: true,
				},
			],
			callback: (ev) =>
				self.sendCmdFields('setViewerLanguage', { session: ev.options.session, value: ev.options.lang }),
		},
		set_viewer_direction: {
			name: 'Fullscreen: set text direction',
			options: [
				sess(),
				{
					type: 'dropdown',
					id: 'dir',
					label: 'Text direction',
					default: 'btt',
					disableAutoExpression: true,
					choices: [
						{ id: 'btt', label: 'Bottom to top' },
						{ id: 'ttb', label: 'Top to bottom' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: (ev) =>
				self.sendCmdFields('setViewerDirection', { session: ev.options.session, value: ev.options.dir }),
		},
		set_viewer_zoom: {
			name: 'Fullscreen: set browser zoom',
			options: [
				sess(),
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
			callback: (ev) => self.sendCmdFields('setViewerZoom', { session: ev.options.session, value: ev.options.zoom }),
		},
		set_viewer_voiceover: viewerToggle('Fullscreen: play audio translation', 'setViewerVoiceover'),
		set_viewer_original: viewerToggle('Fullscreen: show source-language transcript', 'setViewerOriginal'),
		set_viewer_qr: viewerToggle('Fullscreen: show QR code', 'setViewerQr'),
		set_viewer_info: viewerToggle('Fullscreen: show event info link', 'setViewerInfo'),

		// --- Fullscreen monitor ---
		set_display: {
			name: 'Fullscreen: select monitor',
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
			callback: (ev) => self.sendCmdFields('setDisplay', { value: ev.options.display }),
		},
		display_next: { name: 'Fullscreen: next monitor', ...cmd('displayNext') },
		display_prev: { name: 'Fullscreen: previous monitor', ...cmd('displayPrev') },
		session_next: { name: 'Next session (delivery)', ...cmd('sessionNext') },
		session_prev: { name: 'Previous session (delivery)', ...cmd('sessionPrev') },

		open_fullscreen: {
			name: 'Open transcript fullscreen',
			options: [sess()],
			callback: (ev) => self.sendCmdFields('openFullscreen', { session: ev.options.session }),
		},
		close_fullscreen: { name: 'Close transcript fullscreen', ...cmd('closeFullscreen') },
		toggle_fullscreen: {
			name: 'Open/close transcript fullscreen',
			options: [sess()],
			callback: (ev) => self.sendCmdFields('toggleFullscreen', { session: ev.options.session }),
		},
	})
}
