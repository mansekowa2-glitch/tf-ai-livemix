# TF AI Livemix

## Overview
TF AI Livemix is an open‑source project that uses AI to create livestream mixes for Yamaha TF series mixers. It listens to your TF mixer via USB multichannel audio and controls mixer faders over IP using Yamaha's MCP protocol. The system runs entirely on your local network and respects the console's existing front‑of‑house mix by using a separate custom layer for streaming.

### Features
- Custom‑layer‑only mixing: define your own "Pastor 1", "Band", "Vox", etc., and the AI will only adjust those channels.  
- Multi mixer support: connect as many TF‑series consoles as you have and assign each its own layout and AI.  
- Modern web UI: a browser‑based dashboard with glass‑like faders inspired by Apple's "Liquid" design.  
- Real‑time AI logic: speech detection and smooth gain riding ensure that spoken word is always intelligible while the band stays balanced.  
- Extensible: built as a monorepo with a bridge (Node.js), an audio engine (Python), and a Next.js web UI.

## Repository Structure
- `apps/tf‑bridge/` – Node.js server that connects to your TF mixer over TCP and exposes a WebSocket API for fader control. It also enforces the custom‑layer allowlist so the AI cannot move other faders.  
- `services/audio‑engine/` – Python service that captures multitrack audio from the TF mixer via USB, detects who is speaking, and sends fader adjustments to the bridge.  
- `apps/web‑ui/` – Next.js app that provides the control dashboard with realistic faders, mixer selection, and channel labels.  
- `shared/config/` – configuration files. `custom-layer.example.json` shows how to define your layout. Copy it to `custom-layer.json` and customise it for your own channels.

## Prerequisites
- **Node.js** (v18 or newer) and **npm** for the bridge and web UI.  
- **Python 3.10+** for the audio engine.  
- A **Yamaha TF series mixer** with current firmware and the Yamaha Steinberg USB driver installed (if on Windows).  
- The mixer and your computer must be on the same local network. Connect the TF's NETWORK port to your Wi‑Fi router or switch, and connect your computer to the same network.  
- Optional: for multi‑mixer setups, each mixer must have a unique IP address.

## Setup Guide

### 1. Clone this repository
```sh
git clone https://github.com/your‑username/tf‑ai‑livemix.git
cd tf‑ai‑livemix
```

### 2. Define your custom layer
Copy the example config and edit it:
```sh
cp shared/config/custom-layer.example.json shared/config/custom-layer.json
```
Then open `shared/config/custom-layer.json` in a text editor. For each item, specify the TF channel number (`tfChannel`), USB channel (`usbChannel`), and base AI parameters. Do **not** commit your real `custom-layer.json` to Git; `.gitignore` already ignores it.

### 3. Run the TF bridge
```sh
cd apps/tf‑bridge
npm install
npm run build
TF_HOST=<mixer-ip> TF_PORT=49280 WS_PORT=7070 npm start
```
Replace `<mixer-ip>` with your TF mixer’s IP address. If you have multiple mixers, run multiple bridge instances on different ports (for example 7070, 7071, etc.).

### 4. Run the audio engine
```sh
cd services/audio‑engine
python -m venv .venv
source .venv/bin/activate  # On Windows use .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
The audio engine will read `shared/config/custom-layer.json` and start listening to the mixer’s USB interface. Make sure your computer is connected to the TF mixer via USB.

### 5. Run the web UI
The UI is built with Next.js. From another terminal:
```sh
cd apps/web‑ui
npm install
npm run dev
```
By default the UI expects the bridge WebSocket at `ws://localhost:7070`. If you have multiple mixers, the UI will let you add each one by its WebSocket URL.

Once the dev server is running, open `http://localhost:3000` in your browser. You should see a dashboard where you can:
- Add a mixer by entering its name, WebSocket URL, and the path to its custom‑layer file.  
- Select a mixer card to open its faders.  
- See real‑time levels and AI adjustments.

### 6. Customising and extending
- To support more than one mixer, duplicate the bridge and audio‑engine processes with different config files and ports.  
- The `apps/web‑ui` can be customised with your own branding or additional controls. The UI uses Tailwind CSS and Framer Motion.

### 7. Troubleshooting
- If the bridge cannot connect, double‑check the TF mixer’s IP (found under Setup > Network on the console) and ensure port 49280 is open.  
- If the audio engine can’t find the USB device, install the Yamaha Steinberg USB driver (Windows) and verify the mixer shows up in `sounddevice.query_devices()` output.  
- Use the `Console Output` panel in the web UI to see raw messages from the mixer for debugging.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.
