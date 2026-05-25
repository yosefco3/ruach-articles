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

const { uploadFile, uploadBuffer, downloadFile, getPublicUrl, getPresignedUrl, getStorageMode } =
  await import('./storage');

describe('Local Storage (no R2)', () => {
  beforeEach(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reports storage mode as local', () => {
    expect(getStorageMode()).toBe('local');
  });

  it('returns /uploads/ public URLs', () => {
    expect(getPublicUrl('photo.jpg')).toBe('/uploads/photo.jpg');
    expect(getPublicUrl('sub/dir/file.png')).toBe('/uploads/sub/dir/file.png');
  });

  it('getPresignedUrl falls back to local public URL', async () => {
    const url = await getPresignedUrl('test.txt');
    expect(url).toBe('/uploads/test.txt');
  });

  it('uploadFile copies file to local dir and returns URL', async () => {
    const srcFile = path.join(tmpDir, 'source.txt');
    fs.writeFileSync(srcFile, 'hello from uploadFile');

    const url = await uploadFile(srcFile, 'uploaded.txt', 'text/plain');
    expect(url).toBe('/uploads/uploaded.txt');

    const dest = path.join(tmpDir, 'uploaded.txt');
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, 'utf-8')).toBe('hello from uploadFile');
  });

  it('uploadBuffer writes buffer to local dir and returns URL', async () => {
    const buf = Buffer.from('hello from buffer');
    const url = await uploadBuffer(buf, 'buffer.txt', 'text/plain');
    expect(url).toBe('/uploads/buffer.txt');

    const dest = path.join(tmpDir, 'buffer.txt');
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, 'utf-8')).toBe('hello from buffer');
  });

  it('downloadFile copies from local uploads to target path', async () => {
    const srcFile = path.join(tmpDir, 'dl-source.txt');
    fs.writeFileSync(srcFile, 'download me');
    await uploadFile(srcFile, 'dl-test.txt');

    const downloadDest = path.join(tmpDir, 'downloaded.txt');
    await downloadFile('dl-test.txt', downloadDest);

    expect(fs.existsSync(downloadDest)).toBe(true);
    expect(fs.readFileSync(downloadDest, 'utf-8')).toBe('download me');
  });

  it('uploadFile creates nested subdirectories automatically', async () => {
    const srcFile = path.join(tmpDir, 'nested-src.txt');
    fs.writeFileSync(srcFile, 'nested content');

    const url = await uploadFile(srcFile, 'a/b/c/nested.txt');
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