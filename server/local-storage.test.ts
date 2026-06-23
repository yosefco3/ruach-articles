import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

const tmpDir = path.join(os.tmpdir(), `ruach-test-uploads-${Date.now()}`);

// Set env BEFORE importing storage so LOCAL_UPLOAD_DIR is captured correctly
process.env.LOCAL_UPLOAD_DIR = tmpDir;

// Mock the env module to prevent process.exit
vi.mock('./_core/env', () => ({
  env: { NODE_ENV: 'development' },
  isR2Configured: () => false,
}));

const { uploadBuffer, getPublicUrl } = await import('./storage');

describe('Local Storage (no R2)', () => {
  beforeEach(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns /uploads/ public URLs', () => {
    expect(getPublicUrl('photo.jpg')).toBe('/uploads/photo.jpg');
    expect(getPublicUrl('sub/dir/file.png')).toBe('/uploads/sub/dir/file.png');
  });

  it('uploadBuffer writes buffer to local dir and returns URL', async () => {
    const buf = Buffer.from('hello from buffer');
    const url = await uploadBuffer(buf, 'buffer.txt', 'text/plain');
    expect(url).toBe('/uploads/buffer.txt');

    const dest = path.join(tmpDir, 'buffer.txt');
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, 'utf-8')).toBe('hello from buffer');
  });

  it('uploadBuffer creates nested subdirectories automatically', async () => {
    const url = await uploadBuffer(Buffer.from('nested content'), 'a/b/c/nested.txt');
    expect(url).toBe('/uploads/a/b/c/nested.txt');

    const dest = path.join(tmpDir, 'a', 'b', 'c', 'nested.txt');
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, 'utf-8')).toBe('nested content');
  });

  it('uploadBuffer overwrites existing file', async () => {
    await uploadBuffer(Buffer.from('v1'), 'overwrite.txt');
    await uploadBuffer(Buffer.from('v2'), 'overwrite.txt');

    const dest = path.join(tmpDir, 'overwrite.txt');
    expect(fs.readFileSync(dest, 'utf-8')).toBe('v2');
  });
});