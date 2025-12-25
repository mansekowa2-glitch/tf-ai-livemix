# tf-ai-livemix
# TF AI Livemix

Monorepo:
- apps/tf-bridge: TF5 IP control bridge (WS -> TF TCP)
- services/audio-engine: USB multitrack listener + AI fader logic
- apps/web-ui: browser UI (TF-style faders, liquid glass look)

## Quick start
### tf-bridge
cd apps/tf-bridge
npm i
npm run build
TF_HOST=192.168.1.50 TF_PORT=49280 WS_PORT=7070 node dist/server.js

### audio-engine
cd services/audio-engine
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
