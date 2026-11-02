import { combineRgb } from '@companion-module/base'

// Shared colors
export const COLORS = {
	white: combineRgb(255, 255, 255),
	black: combineRgb(20, 18, 14),
	green: combineRgb(40, 140, 70),
	red: combineRgb(176, 72, 58),
	gold: combineRgb(196, 132, 42),
	dark: combineRgb(24, 22, 18),
}

export const DEFAULT_PORT = 8465
export const DEFAULT_HOST = '127.0.0.1'
export const HEARTBEAT_MS = 20000

// Maps each feedback to the published variable it depends on, so publish() can
// re-check only the feedbacks whose underlying value actually changed.
export const FEEDBACK_DEPS = {
	sending: 'sending',
	is_error: 'status',
	ext_connected: 'connected',
	language_is: 'language',
	session_is: 'session',
	viewer_language_is: 'viewer_language',
	direction_is: 'direction',
	zoom_is: 'zoom',
	voiceover_on: 'voiceover',
	original_on: 'original',
	qr_on: 'qr',
	info_on: 'info',
	display_is: 'display',
	fullscreen_open: 'fullscreen',
}
