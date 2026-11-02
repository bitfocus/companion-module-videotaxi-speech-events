export function UpdateVariableDefinitions(self) {
	self.setVariableDefinitions({
		sending: { name: 'Currently sending (true/false)' },
		status: { name: 'Status (idle/connecting/sending/error/disconnected)' },
		error: { name: 'Error text' },
		language: { name: 'Input language (code)' },
		session: { name: 'Session ID' },
		session_name: { name: 'Session name (delivery)' },
		level: { name: 'Audio level (0–100)' },
		zoom: { name: 'Browser zoom (factor)' },
		connected: { name: 'Extension connected (true/false)' },
		viewer_language: { name: 'Fullscreen display language (code, "" = source language)' },
		direction: { name: 'Fullscreen text direction (btt/ttb)' },
		voiceover: { name: 'Fullscreen: audio translation (true/false)' },
		original: { name: 'Fullscreen: source language (true/false)' },
		qr: { name: 'Fullscreen: QR code (true/false)' },
		info: { name: 'Fullscreen: event info link (true/false)' },
		display: { name: 'Fullscreen monitor (ID)' },
		display_name: { name: 'Fullscreen monitor (name)' },
		fullscreen: { name: 'Transcript fullscreen open (true/false)' },
	})
	self.publish()
}
