const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

class ChildProcessManager {
  constructor() {
    this.process = null;
    this.port = 5000;
  }

  async start(isDev) {
    const root = isDev
      ? path.resolve(__dirname, '..', '..', '..')
      : path.resolve(process.resourcesPath);

    const apiServerEntry = isDev
      ? path.join(root, 'artifacts', 'api-server', 'dist', 'index.mjs')
      : path.join(process.resourcesPath, 'api-server', 'dist', 'index.mjs');
    const cwd = isDev
      ? path.join(root, 'artifacts', 'api-server')
      : path.join(process.resourcesPath, 'api-server');
    const env = { ...process.env, PORT: String(this.port), NODE_ENV: isDev ? 'development' : 'production' };

    return new Promise((resolve) => {
      this.process = spawn('node', ['--enable-source-maps', apiServerEntry], {
        cwd,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      this.process.stdout.on('data', (data) => {
        const msg = data.toString();
        process.stdout.write(`[api-server] ${msg}`);
        if (msg.includes('Server listening') || msg.includes('listening')) {
          resolve(true);
        }
      });

      this.process.stderr.on('data', (data) => {
        process.stderr.write(`[api-server:err] ${data.toString()}`);
      });

      this.process.on('error', (err) => {
        console.error('[api-server] Failed to start:', err.message);
        resolve(false);
      });

      this.process.on('exit', (code) => {
        console.log(`[api-server] Exited with code ${code}`);
        this.process = null;
      });

      /* Fallback: if server doesn't respond within 15s, check via HTTP */
      setTimeout(async () => {
        if (!this.process) return resolve(false);
        const alive = await this.healthCheck();
        resolve(alive);
      }, 15000);
    });
  }

  healthCheck() {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${this.port}/api/healthz`, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(3000, () => { req.destroy(); resolve(false); });
    });
  }

  async stop() {
    if (this.process) {
      this.process.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 2000));
      if (this.process) {
        this.process.kill('SIGKILL');
      }
      this.process = null;
    }
  }

  getPort() { return this.port; }
  isRunning() { return this.process !== null; }
}

module.exports = { ChildProcessManager };
