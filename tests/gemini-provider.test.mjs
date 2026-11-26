import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { callLLM, runExpansion, estimateGeminiCostUsd, formatErrorWithCause } from '../agents/run-weekly-expansion.mjs';
import { scanForLeaks, redactSecrets } from '../engines/security.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
// Synthetic, non-functional key shaped like a real Gemini key (AQ. format) to test redaction.
const FAKE_KEY = `AQ.${'Ab3_x9-'.repeat(7)}Zq`;

function interactionResponse(payload, usage = { total_input_tokens: 1000, total_output_tokens: 200, total_thought_tokens: 100 }) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      status: 'completed',
      usage,
      steps: [
        { type: 'thought', signature: 'sig' },
        { type: 'model_output', content: [{ type: 'text', text: JSON.stringify(payload) }] }
      ]
    })
  };
}

test('Gemini: uses Interactions API with header auth (key never in URL) and parses model_output', async () => {
  let seen;
  const fetchImpl = async (url, options) => { seen = { url: String(url), options }; return interactionResponse({ newItems: [], summary: 'ok' }); };
  const { parsed, estimatedCostUsd } = await callLLM('sys', 'user', { env: { GEMINI_API_KEY: FAKE_KEY }, fetchImpl, retryDelayMs: 1 });

  assert.equal(seen.url, 'https://generativelanguage.googleapis.com/v1beta/interactions');
  assert.ok(!seen.url.includes(FAKE_KEY));
  assert.equal(seen.options.headers['x-goog-api-key'], FAKE_KEY);
  const body = JSON.parse(seen.options.body);
  assert.equal(body.model, 'gemini-3.5-flash-lite');
  assert.equal(body.response_format.mime_type, 'application/json');
  assert.deepEqual(parsed, { newItems: [], summary: 'ok' });
  // 1000 in * $0.30/M + 300 out(incl. thinking) * $2.50/M
  assert.ok(Math.abs(estimatedCostUsd - 0.00105) < 1e-9);
});

test('Gemini: cost estimate counts thinking tokens and falls back for unknown models', () => {
  assert.ok(Math.abs(estimateGeminiCostUsd('gemini-3.5-flash-lite', { total_input_tokens: 1_000_000 }) - 0.30) < 1e-9);
  assert.ok(Math.abs(estimateGeminiCostUsd('gemini-3.5-flash-lite', { total_thought_tokens: 1_000_000 }) - 2.50) < 1e-9);
  assert.ok(estimateGeminiCostUsd('some-future-model', { total_input_tokens: 1_000_000 }) >= 1.5);
  assert.equal(estimateGeminiCostUsd('gemini-3.5-flash-lite', {}), 0.01);
});

test('Gemini: provider errors are surfaced and the key is redacted from error text and telemetry', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'playbook-gemini-'));
  fs.cpSync(path.join(rootDir, 'data'), path.join(tmp, 'data'), { recursive: true });
  fs.cpSync(path.join(rootDir, 'agents'), path.join(tmp, 'agents'), { recursive: true });
  let calls = 0;
  const fetchImpl = async (url) => {
    if (String(url).includes('itunes.apple.com') || String(url).includes('hn.algolia.com')) throw new Error('offline');
    calls++;
    return { ok: false, status: 400, text: async () => `{"error":{"message":"API key not valid: ${FAKE_KEY}"}}` };
  };
  try {
    const res = await runExpansion({ rootDir: tmp, agentId: 'competitor-complaint-miner', env: { GEMINI_API_KEY: FAKE_KEY }, fetchImpl, retryDelayMs: 1 });
    assert.equal(calls, 1); // 4xx is not retried
    assert.equal(res.totalAdded, 0);
    assert.match(res.failures[0].error, /Gemini API fout \(400/);
    assert.ok(!res.failures[0].error.includes(FAKE_KEY));
    const telemetry = fs.readFileSync(path.join(tmp, 'data/agent-telemetry.json'), 'utf8');
    assert.ok(!telemetry.includes(FAKE_KEY));
    assert.equal(scanForLeaks(telemetry).filter((f) => f.type === 'secret').length, 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Gemini: 429 rate limits are retried before succeeding', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    if (calls === 1) return { ok: false, status: 429, text: async () => 'RESOURCE_EXHAUSTED' };
    return interactionResponse({ newItems: [], summary: 'na retry' });
  };
  const { parsed } = await callLLM('s', 'u', { env: { GEMINI_API_KEY: FAKE_KEY }, fetchImpl, retryDelayMs: 1 });
  assert.equal(calls, 2);
  assert.equal(parsed.summary, 'na retry');
});

test('Security: leak scanner and redaction catch Google/Gemini keys and key= query params', () => {
  assert.equal(scanForLeaks(`key ${FAKE_KEY}`)[0]?.name, 'Google/Gemini API key (AQ.)');
  assert.equal(scanForLeaks('AIza' + 'B'.repeat(35))[0]?.name, 'Google API key (classic)');
  assert.equal(redactSecrets('https://x.test/m?key=abc123&y=1'), 'https://x.test/m?key=[REDACTED_SECRET]&y=1');
  assert.ok(!formatErrorWithCause(new Error(`boom ${FAKE_KEY}`), {}).includes(FAKE_KEY));
  assert.ok(!redactSecrets('secret-value-xyz here', ['secret-value-xyz']).includes('secret-value-xyz'));
});
