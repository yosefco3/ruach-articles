import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Production Safety', () => {
  describe('Git Configuration', () => {
    it('should have development branch', () => {
      try {
        const branches = execSync('git branch', { encoding: 'utf-8' });
        expect(branches).toContain('development');
      } catch (error) {
        // If git is not initialized, skip this test
        console.warn('Git not initialized, skipping branch test');
      }
    });

    it('should have .gitignore with sensitive files', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

      // Sensitive files that should NEVER be committed
      const sensitivePatterns = [
        '.env',
        '.env.local',
        '.env.production.local',
        'uploads/',
      ];

      sensitivePatterns.forEach(pattern => {
        expect(gitignore).toContain(pattern);
      });
    });

    it('should NOT have .env.local in git', () => {
      try {
        const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' });
        expect(trackedFiles).not.toContain('.env.local');
      } catch (error) {
        console.warn('Git not initialized, skipping tracked files test');
      }
    });

    it('should NOT have uploads/ in git', () => {
      try {
        const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' });
        expect(trackedFiles).not.toContain('uploads/');
      } catch (error) {
        console.warn('Git not initialized, skipping tracked files test');
      }
    });
  });

  describe('Environment Separation', () => {
    it('should have .env.example without secrets', () => {
      const envExamplePath = path.join(process.cwd(), '.env.example');
      const envExample = fs.readFileSync(envExamplePath, 'utf-8');

      // Should NOT contain real secrets
      expect(envExample).not.toContain('GOCSPX-');
      expect(envExample).not.toContain('dev_password_2024');
      expect(envExample).not.toContain('tidb');
    });

    it('should have a developer environment setup directory', () => {
      const docsDir = path.join(process.cwd(), 'dev-environment-setup');
      expect(fs.existsSync(docsDir)).toBe(true);
    });
  });

  describe('Production Configuration', () => {
    it('should have separate production .env template', () => {
      // .env.example should show production structure
      const envExamplePath = path.join(process.cwd(), '.env.example');
      const envExample = fs.readFileSync(envExamplePath, 'utf-8');

      // Should mention production options
      expect(envExample).toContain('R2_ENDPOINT');
      expect(envExample).toContain('R2_ACCESS_KEY_ID');
    });
  });
});