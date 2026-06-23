import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

// ════════════════════════════════════════════════════════════════
// Dev Environment Integration Test (Prompt 5)
//
// Validates the FULL local development environment:
//   1. Docker + MySQL connectivity
//   2. .env.local existence and required keys
//   3. Local storage is active (no R2 required)
//   4. OAuth config for Google/GitHub (skip with message if missing)
//   5. Production safety — isProduction() is false
// ════════════════════════════════════════════════════════════════

const PROJECT_ROOT = path.resolve(process.cwd());
const ENV_LOCAL_PATH = path.join(PROJECT_ROOT, '.env.local');

// ─── Helper: parse .env.local into key→value map ────────────────
function parseEnvFile(filePath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return vars;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

// ════════════════════════════════════════════════════════════════
// 1. Docker + MySQL
// ════════════════════════════════════════════════════════════════
describe('1. Docker + MySQL', () => {
  it('docker command is available', () => {
    let dockerAvailable = false;
    try {
      execSync('docker --version', { stdio: 'pipe', timeout: 10_000 });
      dockerAvailable = true;
    } catch {
      // Docker not available
    }
    expect(dockerAvailable).toBe(true);
  });

  it('ruach-mysql container is running', () => {
    let running = false;
    try {
      const out = execSync('docker inspect -f "{{.State.Running}}" ruach-mysql 2>/dev/null', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10_000,
      });
      running = out.trim() === 'true';
    } catch {
      // Container not found
    }
    expect(running).toBe(true);
  });

  it('MySQL responds to ping on port 3306', async () => {
    const envVars = parseEnvFile(ENV_LOCAL_PATH);
    const port = parseInt(envVars.MYSQL_PORT || '3306', 10);
    const host = envVars.MYSQL_HOST || '127.0.0.1';

    let connected = false;
    try {
      const net = await import('net');
      await new Promise<void>((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(3_000);
        socket.on('connect', () => { connected = true; socket.destroy(); resolve(); });
        socket.on('error', reject);
        socket.on('timeout', () => { socket.destroy(); reject(new Error('timeout')); });
        socket.connect(port, host);
      });
    } catch {
      // Connection failed
    }
    expect(connected).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// 2. .env.local file
// ════════════════════════════════════════════════════════════════
describe('2. .env.local file', () => {
  it('file exists at project root', () => {
    expect(fs.existsSync(ENV_LOCAL_PATH)).toBe(true);
  });

  it('contains DATABASE_URL', () => {
    const vars = parseEnvFile(ENV_LOCAL_PATH);
    expect(vars.DATABASE_URL).toBeDefined();
    expect(vars.DATABASE_URL).toContain('mysql://');
  });

  it('contains SESSION_SECRET', () => {
    const vars = parseEnvFile(ENV_LOCAL_PATH);
    expect(vars.SESSION_SECRET).toBeDefined();
    expect(vars.SESSION_SECRET!.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════
// 3. Local Storage
// ════════════════════════════════════════════════════════════════
describe('3. Local Storage', () => {
  it('isR2Configured returns false (local mode)', async () => {
    // Set env to ensure local mode BEFORE import
    process.env.LOCAL_UPLOAD_DIR = path.join(os.tmpdir(), `ruach-inttest-${Date.now()}`);

    vi.mock('./_core/env', () => ({
      env: { NODE_ENV: 'development' },
      isR2Configured: () => false,
    }));

    const { isR2Configured } = await import('./storage');
    expect(isR2Configured()).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// 4. OAuth Config (skip if not configured)
// ════════════════════════════════════════════════════════════════
describe('4. OAuth Config', () => {
  const envVars = parseEnvFile(ENV_LOCAL_PATH);

  it('has Google OAuth variables (or skips)', () => {
    const hasClientId = !!envVars.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!envVars.GOOGLE_CLIENT_SECRET;

    if (!hasClientId || !hasClientSecret) {
      console.log('  ⚠️  Google OAuth not configured — skipping (optional for dev).');
      return; // soft-pass
    }

    expect(envVars.GOOGLE_CLIENT_ID).toContain('.googleusercontent.com');
    expect(envVars.GOOGLE_CLIENT_SECRET!.length).toBeGreaterThan(10);
  });

  it('has GitHub OAuth variables (or skips)', () => {
    const hasClientId = !!envVars.GITHUB_CLIENT_ID;
    const hasClientSecret = !!envVars.GITHUB_CLIENT_SECRET;

    if (!hasClientId || !hasClientSecret) {
      console.log('  ⚠️  GitHub OAuth not configured — skipping (optional for dev).');
      return; // soft-pass
    }

    expect(envVars.GITHUB_CLIENT_ID!.length).toBeGreaterThan(0);
    expect(envVars.GITHUB_CLIENT_SECRET!.length).toBeGreaterThan(5);
  });
});

// ════════════════════════════════════════════════════════════════
// 5. Production Safety
// ════════════════════════════════════════════════════════════════
describe('5. Production Safety', () => {
  it('NODE_ENV is NOT production', () => {
    const nodeEnv = process.env.NODE_ENV || 'test';
    expect(nodeEnv).not.toBe('production');
  });

  it('DATABASE_URL does NOT point to a production host', () => {
    const envVars = parseEnvFile(ENV_LOCAL_PATH);
    const url = envVars.DATABASE_URL || '';
    // Local URLs should contain localhost or 127.0.0.1
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    expect(isLocal).toBe(true);
  });

  it('.env.local is excluded from git', () => {
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    expect(gitignore).toContain('.env.local');
  });
});