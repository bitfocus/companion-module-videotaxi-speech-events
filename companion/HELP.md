## VIDEO.TAXI SPEECH EVENTS

Companion module for the Chrome extension **"VIDEO.TAXI - SPEECH EVENTS Controller"**. The module hosts a local WebSocket server; the extension connects to it, sends audio to a VIDEO.TAXI Speech session and shows the live transcript in fullscreen.

### Setup

1. Add this **VIDEO.TAXI Speech** connection. Keep **WebSocket IP** `127.0.0.1` and **Port** `8465` (default).
2. In the Chrome extension options, open the card **"Companion / Stream Deck"**, enable it and set the address `ws://127.0.0.1:8465`.
3. The connection turns **green ("OK")** once the extension connects.

### Features

- **Actions:** start/stop sending, start/stop toggle, next/previous input language, direct language choice, session selection and cycling, fullscreen open/close/toggle, monitor selection and cycling, browser zoom, and the fullscreen viewer options (audio translation, original language, QR code, event info link, text direction) per session.
- **Feedbacks** for every state (sending, error, connection, language, session, viewer options, monitor, fullscreen open).
- **Variables** such as `sending`, `language`, `session_name`, `zoom`, `display_name`, `fullscreen`.
- **Presets** for the common buttons.

The connection label defaults to `VIDEO_TAXI_Speech`; preset variable texts use this label.
