import net from "node:net";

export class TfClient {
  private sock?: net.Socket;
  private buf = "";
  public connected = false;

  constructor(private host: string, private port: number) {}

  connect(onLine: (line: string) => void) {
    this.sock = new net.Socket();
    this.sock.setKeepAlive(true, 5000);

    this.sock.on("connect", () => {
      this.connected = true;
      // MCP1 spec expects LF-terminated ASCII; first handshake commonly checks runmode.
      this.send("devstatus runmode");
      console.log(`[TF] connected ${this.host}:${this.port}`);
    });

    this.sock.on("data", (d) => {
      this.buf += d.toString("utf8");
      const parts = this.buf.split(/\r?\n/);
      this.buf = parts.pop() ?? "";
      for (const p of parts) {
        const line = p.trim();
        if (line) onLine(line);
      }
    });

    this.sock.on("close", () => {
      this.connected = false;
      console.log("[TF] disconnected (reconnect in 2s)");
      setTimeout(() => this.connect(onLine), 2000);
    });

    this.sock.on("error", (e) => console.log("[TF] error:", e.message));
    this.sock.connect(this.port, this.host);
  }

  send(line: string) {
    if (!this.sock || !this.connected) return false;
    this.sock.write(line.trim() + "\n");
    return true;
  }
}
