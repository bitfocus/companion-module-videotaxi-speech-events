import { COLORS, LAYOUT } from './constants.js'
import { ICONS } from './preset-icons.js'

// Ready-made preset tiles that reproduce the shipped Stream Deck layout: each
// carries the matching icon (as png64) plus its action and feedback, so dragging
// a preset onto a button looks and behaves like the designed layout — no need to
// import a .companionconfig.
export function UpdatePresets(self) {
	const C_WHITE = COLORS.white
	const BG = LAYOUT.bg
	const ACTIVE_BG = LAYOUT.activeBg
	const ACTIVE_TEXT = LAYOUT.activeText

	// Connection label used in preset button text (variable references). Uses the
	// live label so a renamed connection keeps working.
	const label = self.label

	// Build a style from the layout. The icons are pre-composited so the flag/icon
	// sits in the upper area on a transparent background; the label then sits in the
	// free lower area, bottom-aligned, at a fixed size — reproducing the layered
	// layout as closely as a flat preset style allows.
	//
	// Companion renders a preset text size at 2.1× in the button, so the "size" passed
	// in below is the value that actually shows up in the Text Size field; we divide by
	// the scale to store the matching preset value. Pass 'auto' to shrink to fit instead.
	const DISPLAY_SCALE = 2.1
	const toSize = (shown) => (shown === 'auto' ? 'auto' : Number(shown) / DISPLAY_SCALE)
	// Spacer line lifts the label off the bottom edge (flat style has no numeric Y).
	// A plain trailing "\n" is trimmed when rendered, so the empty line carries a
	// non-breaking space to survive and still show nothing.
	const SPACER = '\n '
	const style = (text, icon, extra = {}) => ({
		text: `${text}${SPACER}`,
		size: toSize(extra.size ?? 24),
		color: extra.color || C_WHITE,
		bgcolor: extra.bgcolor || BG,
		alignment: extra.alignment || 'center:bottom',
		...(icon ? { png64: icon, pngalignment: 'center:center' } : {}),
	})

	// Highlight style for the active state (gold background, dark text, optional icon).
	const active = (over = {}) => ({ bgcolor: ACTIVE_BG, color: ACTIVE_TEXT, ...over })

	const tile = (name, text, icon, actionId, options, feedbacks, extra) => ({
		type: 'simple',
		name,
		style: style(text, icon, extra),
		steps: actionId ? [{ down: [{ actionId, options: options || {} }], up: [] }] : [{ down: [], up: [] }],
		feedbacks: feedbacks || [],
	})

	// One input-language tile: stop → switch language → start (Weg 2, single action),
	// gold while that language is active.
	const langTile = (text, code, icon, delay) =>
		tile(
			`Input language ${text} (stop → switch → start)`,
			text,
			icon,
			'set_language_and_restart',
			{ lang: code, delay },
			[{ feedbackId: 'language_is', options: { lang: code }, style: active() }],
			{ size: '24' },
		)

	// One fullscreen on/off switch tile for the active session (gold = on).
	const switchTile = (name, text, icon, actionId, feedbackId, size) =>
		tile(name, text, icon, actionId, { session: '', value: 'toggle' }, [{ feedbackId, options: {}, style: active() }], {
			size: size || '24',
		})

	const presets = {
		// --- Status & sending ---
		speech_label: tile('SPEECH label', 'SPEECH', ICONS.speech, null, {}, [], { size: '24' }),
		live_indicator: tile(
			'LIVE indicator (red while sending)',
			'LIVE',
			ICONS.live,
			null,
			{},
			[{ feedbackId: 'sending', options: {}, style: { bgcolor: LAYOUT.liveBg, color: C_WHITE } }],
			{ size: '24' },
		),
		toggle_send: tile(
			'Start/stop sending (START ↔ STOPP)',
			'START',
			ICONS.start,
			'toggle_send',
			{},
			[{ feedbackId: 'sending', options: {}, style: active({ text: 'STOPP\n ', png64: ICONS.stop }) }],
			{ size: '24' },
		),
		session_cycle: tile(
			'Next delivery session (shows current)',
			`Session\n$(${label}:session_name)`,
			null,
			'session_next',
			{},
			[],
			{ alignment: 'center:center', size: '24' },
		),

		// --- Input languages (Weg 2: one button stops, switches, restarts) ---
		lang_de: langTile('DE', 'de-DE', ICONS.lang_de, 500),
		lang_en: langTile('EN', 'en-GB', ICONS.lang_en, 500),
		lang_es: langTile('ES', 'es-ES', ICONS.lang_es, 2000),
		lang_fr: langTile('FR', 'fr-FR', ICONS.lang_fr, 1000),
		lang_it: langTile('IT', 'it-IT', ICONS.lang_it, 1000),
		lang_next: tile(
			'Next input language (shows current)',
			`$(${label}:language)`,
			ICONS.lang_next,
			'lang_next',
			{},
			[],
			{ size: '24' },
		),
		lang_prev: tile('Previous input language', 'Language', ICONS.lang_prev, 'lang_prev', {}, [], { size: '24' }),

		// --- Fullscreen ---
		fullscreen_toggle: tile(
			'Open/close transcript fullscreen',
			'Fullscreen',
			ICONS.fullscreen,
			'toggle_fullscreen',
			{ session: '' },
			[
				{
					feedbackId: 'fullscreen_open',
					options: {},
					style: active({ text: 'Close\nFullscreen\n ', png64: ICONS.fullscreen_close }),
				},
			],
			{ size: '20' },
		),
		direction_toggle: tile(
			'Toggle fullscreen text direction (shows current)',
			'Direction',
			ICONS.direction,
			'set_viewer_direction',
			{ session: '', dir: 'toggle' },
			[
				{ feedbackId: 'direction_is', options: { dir: 'btt' }, style: { png64: ICONS.dir_btt } },
				{ feedbackId: 'direction_is', options: { dir: 'ttb' }, style: { png64: ICONS.dir_ttb } },
			],
			{ size: '24' },
		),

		// --- Fullscreen switches (active session) ---
		voiceover_toggle: switchTile(
			'Toggle audio translation',
			'VOICE-\nOVER',
			ICONS.voiceover,
			'set_viewer_voiceover',
			'voiceover_on',
			'24',
		),
		original_toggle: switchTile(
			'Toggle source-language transcript',
			'ORIGINAL',
			ICONS.original,
			'set_viewer_original',
			'original_on',
			'20',
		),
		qr_toggle: switchTile('Toggle QR code', 'QR-CODE', ICONS.qr, 'set_viewer_qr', 'qr_on', '24'),
		info_toggle: switchTile('Toggle event info link', 'INFO-\nLINK', ICONS.info, 'set_viewer_info', 'info_on', '24'),

		// --- Zoom ---
		zoom_in: tile('Browser zoom +', 'ZOOM', ICONS.zoom_in, 'zoom_next', { session: '' }, [], { size: '24' }),
		zoom_out: tile('Browser zoom −', 'ZOOM', ICONS.zoom_out, 'zoom_prev', { session: '' }, [], { size: '24' }),

		// --- Monitor ---
		display_cycle: tile(
			'Previous monitor (shows current)',
			`$(${label}:display_name)`,
			ICONS.display_prev,
			'display_prev',
			{},
			[],
			{ size: '18' },
		),
	}

	const structure = [
		{
			id: 'status',
			name: 'Status & sending',
			definitions: ['speech_label', 'live_indicator', 'toggle_send', 'session_cycle'],
		},
		{
			id: 'languages',
			name: 'Input languages',
			definitions: ['lang_de', 'lang_en', 'lang_es', 'lang_fr', 'lang_it', 'lang_next', 'lang_prev'],
		},
		{ id: 'fullscreen', name: 'Fullscreen', definitions: ['fullscreen_toggle', 'direction_toggle'] },
		{
			id: 'switches',
			name: 'Fullscreen switches',
			definitions: ['voiceover_toggle', 'original_toggle', 'qr_toggle', 'info_toggle'],
		},
		{ id: 'zoom', name: 'Zoom', definitions: ['zoom_in', 'zoom_out'] },
		{ id: 'monitor', name: 'Monitor', definitions: ['display_cycle'] },
	]

	self.setPresetDefinitions(structure, presets)
}
