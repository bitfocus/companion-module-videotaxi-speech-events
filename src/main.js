import { InstanceBase, InstanceStatus, Regex } from '@companion-module/base'
import { WebSocketServer } from 'ws'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { UpdateVariableDefinitions } from './variables.js'
import { DEFAULT_HOST, DEFAULT_PORT, HEARTBEAT_MS, FEEDBACK_DEPS } from './constants.js'

class VideoTaxiSpeechInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.wss = null
		this.clients = new Set()
		this.heartbeat = null
		this.languages = [] // [{ code, name }] — input languages (from the extension)
		this.viewerLanguages = [] // [{ code, name }] — display languages (fullscreen, union)
		this.sessions = [] // [{ id, name }]
		this.displays = [] // [{ id, name }] — monitors
		this.lastVars = null // last published variable values, for change-only updates
		this.state = {
			sending: false,
			status: 'idle',
			error: '',
			language: '',
			session: '',
			level: 0,
			zoom: 1,
			viewerLanguage: '',
			direction: 'btt',
			voiceover: true,
			showOriginal: true,
			showQrCode: false,
			showInfoButton: true,
			display: '',
			fullscreen: false,
			connected: false,
		}
	}

	async init(config) {
		this.config = config
		this.updateVariableDefinitions()
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.startServer()
	}

	async destroy() {
		this.stopServer()
	}

	async configUpdated(config) {
		const portChanged = (config?.port || '') !== (this.config?.port || '')
		const hostChanged = (config?.host || '') !== (this.config?.host || '')
		this.config = config
		if (portChanged || hostChanged) {
			this.stopServer()
			this.startServer()
		}
		// Rebuild presets on every config update so the connection label used in
		// preset button text always stays in sync with the current label.
		this.updatePresets()
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updatePresets() {
		UpdatePresets(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'How it works',
				value:
					'This module opens a WebSocket server. In the Chrome extension ' +
					'(Options → "Companion / Stream Deck"), enter <b>ws://IP:PORT</b> as the bridge address ' +
					'(same IP and port as below). A separate bridge is then no longer needed. ' +
					'Default is <b>127.0.0.1</b> (local only). For access from another computer, enter a ' +
					'reachable IP of this machine or <b>0.0.0.0</b> for all interfaces.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'WebSocket IP (bind address)',
				width: 8,
				default: DEFAULT_HOST,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'WebSocket port',
				width: 4,
				default: String(DEFAULT_PORT),
				regex: Regex.PORT,
			},
		]
	}

	getHost() {
		const h = String(this.config?.host || '').trim()
		return h || DEFAULT_HOST
	}

	getPort() {
		const p = parseInt(this.config?.port, 10)
		return Number.isFinite(p) && p > 0 ? p : DEFAULT_PORT
	}

	// --- WebSocket server -----------------------------------------------------
	startServer() {
		const port = this.getPort()
		const host = this.getHost()
		this.updateStatus(InstanceStatus.Connecting, 'Waiting for extension …')
		try {
			this.wss = new WebSocketServer({
				host,
				port,
				// Only accept the Chrome extension (chrome-extension://…) and
				// non-browser local clients (no Origin header). Reject ordinary web
				// pages (http/https origin) so a random site cannot drive the module.
				verifyClient: (info) => {
					const origin = info.origin || ''
					if (origin === '' || origin.startsWith('chrome-extension://')) return true
					this.log('warn', `Rejected WebSocket connection from origin ${origin}`)
					return false
				},
			})
		} catch (err) {
			this.updateStatus(InstanceStatus.ConnectionFailure, String(err?.message || err))
			return
		}

		this.wss.on('listening', () => this.log('info', `WebSocket server listening on ws://${host}:${port}`))
		this.wss.on('error', (err) => {
			this.log('error', `Server error: ${err?.message || err}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, String(err?.message || err))
		})
		this.wss.on('connection', (ws) => {
			this.clients.add(ws)
			this.setConnected(true)
			ws.on('message', (data) => this.onMessage(String(data)))
			ws.on('close', () => {
				this.clients.delete(ws)
				if (this.clients.size === 0) this.setConnected(false)
			})
			ws.on('error', () => {
				this.clients.delete(ws)
				if (this.clients.size === 0) this.setConnected(false)
			})
		})

		// Text heartbeat keeps the extension's service worker awake.
		this.heartbeat = setInterval(() => {
			const hb = JSON.stringify({ type: 'hb', t: Date.now() })
			for (const ws of this.clients) {
				if (ws.readyState === ws.OPEN) {
					try {
						ws.send(hb)
					} catch {
						/* ignore */
					}
				}
			}
		}, HEARTBEAT_MS)
	}

	stopServer() {
		if (this.heartbeat) {
			clearInterval(this.heartbeat)
			this.heartbeat = null
		}
		for (const ws of this.clients) {
			try {
				ws.close()
			} catch {
				/* ignore */
			}
		}
		this.clients.clear()
		if (this.wss) {
			try {
				this.wss.close()
			} catch {
				/* ignore */
			}
			this.wss = null
		}
	}

	setConnected(connected) {
		this.state.connected = connected
		if (connected) {
			this.updateStatus(InstanceStatus.Ok)
		} else {
			this.state.level = 0
			this.updateStatus(InstanceStatus.Connecting, 'Waiting for extension …')
		}
		this.publish()
	}

	onMessage(text) {
		let msg
		try {
			msg = JSON.parse(text)
		} catch {
			return
		}
		if (!msg) return

		try {
			if (msg.type === 'state') {
				if ('sending' in msg) this.state.sending = !!msg.sending
				if ('status' in msg) this.state.status = String(msg.status ?? '')
				if ('error' in msg) this.state.error = String(msg.error ?? '')
				if ('language' in msg) this.state.language = String(msg.language ?? '')
				if ('session' in msg) this.state.session = String(msg.session ?? '')
				if ('level' in msg) this.state.level = Number(msg.level) || 0
				if ('zoom' in msg) this.state.zoom = Number(msg.zoom) || 1
				if ('viewerLanguage' in msg) this.state.viewerLanguage = String(msg.viewerLanguage ?? '')
				if ('direction' in msg) this.state.direction = msg.direction === 'ttb' ? 'ttb' : 'btt'
				if ('voiceover' in msg) this.state.voiceover = !!msg.voiceover
				if ('showOriginal' in msg) this.state.showOriginal = !!msg.showOriginal
				if ('showQrCode' in msg) this.state.showQrCode = !!msg.showQrCode
				if ('showInfoButton' in msg) this.state.showInfoButton = !!msg.showInfoButton
				if ('display' in msg) this.state.display = String(msg.display ?? '')
				if ('fullscreen' in msg) this.state.fullscreen = !!msg.fullscreen
				this.publish()
			} else if (msg.type === 'languages') {
				// Keep only valid { code } entries so a stray null cannot crash a choice builder.
				this.languages = (Array.isArray(msg.list) ? msg.list : []).filter((e) => e && e.code)
				// Rebuild dropdowns.
				this.updateActions()
				this.updateFeedbacks()
				this.updatePresets()
			} else if (msg.type === 'sessions') {
				this.sessions = (Array.isArray(msg.list) ? msg.list : []).filter((e) => e && e.id != null)
				this.updateActions()
				// Also refresh the session feedback choices and the session_name variable,
				// which both depend on this list.
				this.updateFeedbacks()
				this.publish()
			} else if (msg.type === 'viewerLanguages') {
				this.viewerLanguages = (Array.isArray(msg.list) ? msg.list : []).filter((e) => e && e.code)
				this.updateActions()
				this.updateFeedbacks()
			} else if (msg.type === 'displays') {
				this.displays = (Array.isArray(msg.list) ? msg.list : []).filter((e) => e && e.id != null)
				this.updateActions()
				this.updateFeedbacks()
				// Refresh the display_name variable, which resolves against this list.
				this.publish()
			}
		} catch (err) {
			this.log('error', `Failed to handle message: ${err?.message || err}`)
		}
	}

	publish() {
		const vars = {
			sending: this.state.sending,
			status: this.state.status,
			error: this.state.error,
			language: this.state.language,
			session: this.state.session,
			session_name: this.nameFor(this.sessions, this.state.session),
			level: this.state.level,
			zoom: this.state.zoom,
			viewer_language: this.state.viewerLanguage,
			direction: this.state.direction,
			voiceover: this.state.voiceover,
			original: this.state.showOriginal,
			qr: this.state.showQrCode,
			info: this.state.showInfoButton,
			display: this.state.display,
			display_name: this.state.display ? this.nameFor(this.displays, this.state.display) : 'Current screen',
			fullscreen: this.state.fullscreen,
			connected: this.state.connected,
		}

		// Send only the variables that actually changed since the last publish.
		const prev = this.lastVars || {}
		const changed = {}
		for (const k in vars) {
			if (prev[k] !== vars[k]) changed[k] = vars[k]
		}
		this.lastVars = vars
		const changedKeys = Object.keys(changed)
		if (changedKeys.length === 0) return
		this.setVariableValues(changed)

		// Re-check only the feedbacks whose underlying variable changed.
		const feedbacks = []
		for (const [feedbackId, varKey] of Object.entries(FEEDBACK_DEPS)) {
			if (varKey in changed) feedbacks.push(feedbackId)
		}
		if (feedbacks.length) this.checkFeedbacks(...feedbacks)
	}

	sendCmd(action, value) {
		this.sendCmdFields(action, value !== undefined ? { value } : {})
	}

	sendCmdFields(action, fields) {
		const text = JSON.stringify(Object.assign({ type: 'cmd', action }, fields || {}))
		let sent = 0
		for (const ws of this.clients) {
			if (ws.readyState === ws.OPEN) {
				try {
					ws.send(text)
					sent++
				} catch {
					/* ignore */
				}
			}
		}
		if (sent === 0) this.log('warn', `Command "${action}" not sent — no extension connected.`)
	}

	// Human-readable name for an ID from an {id,name} list (fallback: the ID itself).
	nameFor(list, id) {
		const m = (list || []).find((x) => String(x.id) === String(id))
		return m ? m.name : id || ''
	}

	languageMatches(value) {
		const cur = (this.state.language || '').toLowerCase()
		const t = (value || '').toLowerCase()
		return !!t && (cur === t || cur.startsWith(t))
	}

	langChoices() {
		return this.languages.length
			? this.languages.map((l) => ({ id: l.code, label: `${l.name} (${l.code})` }))
			: [{ id: 'de-DE', label: 'de-DE (list not loaded yet)' }]
	}

	sessionChoices() {
		return this.sessions.length
			? this.sessions.map((s) => ({ id: s.id, label: s.name }))
			: [{ id: '', label: '(sessions not loaded yet)' }]
	}

	// For fullscreen actions: additionally the active delivery session (empty ID →
	// the extension uses the currently selected session, i.e. follows the selection).
	viewerSessionChoices() {
		return [{ id: '', label: 'Active delivery session' }].concat(
			this.sessions.map((s) => ({ id: s.id, label: s.name })),
		)
	}

	viewerLangChoices() {
		return [{ id: '', label: 'Default (source language)' }].concat(
			this.viewerLanguages.map((l) => ({ id: l.code, label: `${l.name} (${l.code})` })),
		)
	}

	displayChoices() {
		return [{ id: '', label: 'Default (current screen)' }].concat(
			this.displays.map((d) => ({ id: d.id, label: d.name })),
		)
	}
}

export default VideoTaxiSpeechInstance
export { UpgradeScripts }
