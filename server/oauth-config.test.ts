import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * OAuth Configuration Tests
 *
 * Validates that .env.local has the correct OAuth configuration structure.
 * These tests check the FILE CONTENT directly (not the runtime env module)
 * to avoid triggering process.exit() from env.ts validation.
 *
 * These tests will FAIL until real Google OAuth credentials are configured
 * in .env.local (as expected by prompt 04 workflow).
 */
const envPath = resolve(process.cwd(), '.env.local');

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    vars[key] = val;
  }
  return vars;
}

const env = parseEnvFile(envPath);

describe('OAuth Configuration', () => {
  it('should have .env.local file present', () => {
    expect(existsSync(envPath), '.env.local file must exist').toBe(true);
  });

  it('should have Google OAuth credentials defined', () => {
    expect(env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID must be set in .env.local').toBeDefined();
    expect(env.GOOGLE_CLIENT_ID!.length, 'GOOGLE_CLIENT_ID must not be empty').toBeGreaterThan(0);

    expect(env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET must be set in .env.local').toBeDefined();
    expect(env.GOOGLE_CLIENT_SECRET!.length, 'GOOGLE_CLIENT_SECRET must not be empty').toBeGreaterThan(0);

    expect(env.GOOGLE_CALLBACK_URL, 'GOOGLE_CALLBACK_URL must be set in .env.local').toBeDefined();
  });

  it('should NOT use placeholder Google Client ID', () => {
    const clientId = env.GOOGLE_CLIENT_ID;
    expect(clientId).not.toBe('your-client-id.apps.googleusercontent.com');
    expect(clientId).not.toContain('your-client');
    // Real Google Client IDs end with .apps.googleusercontent.com
    expect(clientId).toMatch(/\.apps\.googleusercontent\.com$/);
  });

  it('should NOT use placeholder Google Client Secret', () => {
    const secret = env.GOOGLE_CLIENT_SECRET;
    expect(secret).not.toBe('GOCSPX-your-client-secret');
    expect(secret).not.toContain('your-client-secret');
    // Google Client Secrets typically start with GOCSPX-
    expect(secret).toMatch(/^GOCSPX-/);
  });

  it('should use localhost callback URL in development', () => {
    const url = env.GOOGLE_CALLBACK_URL;
    expect(url).toContain('localhost');
    expect(url).toContain('http://');
    expect(url).toContain('/auth/google/callback');
  });

  it('should have JWT secret configured with minimum length', () => {
    expect(env.JWT_SECRET, 'JWT_SECRET must be set').toBeDefined();
    expect(env.JWT_SECRET!.length, 'JWT_SECRET must be at least 16 characters').toBeGreaterThanOrEqual(16);
    expect(env.JWT_SECRET).not.toBe('dev-secret-change-me-min-16-chars-required');
  });

  it('should have admin email configured with valid format', () => {
    expect(env.ADMIN_EMAIL, 'ADMIN_EMAIL must be set').toBeDefined();
    expect(env.ADMIN_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});