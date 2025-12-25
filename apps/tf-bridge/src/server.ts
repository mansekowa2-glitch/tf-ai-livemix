import { WebSocketServer } from 'ws';
import { TfClient } from './tfClient.js';
import fs from 'fs';
import path from 'path';

const TF_HOST = process.env.TF_HOST ?? '192.168.1.50';
const TF_PORT = Number(process.env.TF_PORT ?? 49280);
const WS_PORT = Number(process.env.WS_PORT ?? 7070);

const configPath = path.resolve(process.cwd(), '../../shared/config/custom-layer.example.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function buildAllowedChannels() {
  const allowed = new Set<number>();
  for (const item of config.items) {
    if (item.type === 'channel') {
      allowed.add(item.tfChannel);
    }
    if (item.type === 'group') {
      for (const m of item.members) {
        allowed.add(m.tfChannel);
      }
    }
  }
  return allowed;
}
const ALLOWED = buildAllowedChannels();

const tf = new TfClient(TF_HOST, TF_PORT);

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`[WS] ws://localhost:${WS_PORT}`);
console.log(`[TF] target ${TF_HOST}:${TF_PORT}`);
console.log(`[SAFE] Custom Layer channels allowed: ${[...ALLOWED].sort((a,b) => a - b).join(', ')}`);

tf.connect((line) => {
  const msg = JSON.stringify({ type: 'tf_line', line });
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(msg);
    }
  }
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', tfConnected: tf.connected }));
  ws.on('message', (buf) => {
    const msg = JSON.parse(buf.toString('utf8'));
    if (msg.type === 'setFader') {
      const ch = Number(msg.ch);
      const level100 = Number(msg.level100);
      if (!ALLOWED.has(ch)) {
        ws.send(JSON.stringify({ type: 'blocked', reason: 'Channel not in Custom Layer', ch }));
        return;
      }
      const cmd = `set MIXER:Current/InCh/Fader/Level ${ch} 0 ${level100}`;
      const ok = tf.send(cmd);
      ws.send(JSON.stringify({ type: 'ack', ok, cmd }));
      return;
    }
    if (msg.type === 'raw') {
      const ok = tf.send(String(msg.line ?? ''));
      ws.send(JSON.stringify({ type: 'ack', ok, cmd: msg.line }));
    }
  });
});
