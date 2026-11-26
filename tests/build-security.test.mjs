import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scanForLeaks } from '../engines/security.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

test('Build artifacts compile cleanly and contain zero leaked secrets or personal PII', () => {
  execFileSync(process.execPath, [path.join(rootDir, 'build.mjs')], { cwd: rootDir, stdio: 'pipe' });

  const requiredFiles = [
    'index.html',
    'data.json',
    'app.js',
    'styles.css',
    '.nojekyll',
    'engines/financial-model.mjs',
    'engines/opportunity-scoring.mjs',
    'engines/capital-allocation.mjs',
    'engines/security.mjs',
    'experiments/exp-a-b2b-receptionist/index.html',
    'experiments/exp-b-ringvalue/index.html'
  ];

  for (const rel of requiredFiles) {
    const full = path.join(distDir, rel);
    assert.ok(fs.existsSync(full), `Ontbrekend build-bestand: dist/${rel}`);
    const content = fs.readFileSync(full, 'utf8');
    const leaks = scanForLeaks(content);
    assert.equal(leaks.length, 0, `Secret/PII-lek in dist/${rel}: ${JSON.stringify(leaks)}`);
  }

  const bundle = JSON.parse(fs.readFileSync(path.join(distDir, 'data.json'), 'utf8'));
  assert.equal(bundle.version, '2.0.0');
  assert.equal(bundle.weeklyBrief.validatableNow.length, 2);
  assert.equal(bundle.agentsConfig.agents.length, 12);
});
