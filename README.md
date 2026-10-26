# companion-module-videotaxi-speech-events

Bitfocus Companion module for the Chrome extension **"VIDEO.TAXI - SPEECH EVENTS Controller"**.
The module hosts a local WebSocket server; the extension connects to it, sends audio to a
VIDEO.TAXI Speech session and shows the live transcript in fullscreen.

See [`companion/HELP.md`](companion/HELP.md) for setup and features.

## Development

```
corepack yarn install
corepack yarn package   # builds the .tgz via companion-module-build
```
