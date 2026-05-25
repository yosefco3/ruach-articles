import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Environment Files Setup', () => {
  const rootDir = path.resolve(__dirname, '..');
  const envLocalPath = path.join(rootDir, '.env.local');
  const envExamplePath = path.join(rootDir, '.env.example');

  it('should have .env.local file', () => {
    expect(fs.existsSync(envLocalPath)).toBe(true);
  });

  it('should have .env.example file', () => {
    expect(fs.existsSync(envExamplePath)).toBe(true);
  });

  it('.env.local should contain required development variables', () => {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    
    // Required variables
    expect(content).toContain('NODE_ENV=development');
    expect(content).toContain('PORT=');
    expect(content).toContain('DATABASE_URL=mysql://root:dev_password_2024@localhost:3306/ruach_dev');
    expect(content).toContain('GOOGLE_CLIENT_ID=');
    expect(content).toContain('GOOGLE_CLIENT_SECRET=');
    expect(content).toContain('GOOGLE_CALLBACK_URL=http://localhost:3000');
    expect(content).toContain('JWT_SECRET=');
    expect(content).toContain('ADMIN_EMAIL=');
  });

  it('.env.local should NOT contain production values', () => {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    
    // Should not have production database
    expect(content).not.toContain('tidb');
    expect(content).not.toContain('R2_ENDPOINT');
    expect(content).not.toContain('R2_ACCESS_KEY_ID');
  });

  it('.env.example should be a template without sensitive data', () => {
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    
    // Should have placeholders
    expect(content).toContain('NODE_ENV=');
    expect(content).toContain('DATABASE_URL=');
    expect(content).toContain('GOOGLE_CLIENT_ID=');
    
    // Should NOT have real values
    expect(content).not.toContain('dev_password_2024');
    expect(content).not.toContain('GOCSPX-');
  });

  it('.env.local should have valid DATABASE_URL format', () => {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    const dbUrlMatch = content.match(/DATABASE_URL=(.+)/);
    
    expect(dbUrlMatch).toBeTruthy();
    const dbUrl = dbUrlMatch![1].trim();
    
    // Should be MySQL format
    expect(dbUrl).toMatch(/^mysql:\/\//);
    expect(dbUrl).toContain('localhost:3306');
    expect(dbUrl).toContain('ruach_dev');
  });

  it('.env.local JWT_SECRET should be at least 16 characters', () => {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    const jwtMatch = content.match(/JWT_SECRET=(.+)/);
    
    expect(jwtMatch).toBeTruthy();
    const jwtSecret = jwtMatch![1].trim();
    
    expect(jwtSecret.length).toBeGreaterThanOrEqual(16);
  });
});
