// Security utilities: prompt-injection sanitization & secret/PII leakage scanning.

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /disregard\s+(all\s+)?(previous|prior|system)\s+instructions?/gi,
  /you\s+are\s+now\s+(a|an|my)\s+/gi,
  /system\s*prompt\s*:/gi,
  /<\s*\/?\s*(system|assistant|tool_call|instructions?)\s*>/gi,
  /execute\s+shell\s+command/gi,
  /exfiltrate\s+(secrets?|tokens?|keys?)/gi
];

const SECRET_PATTERNS = [
  { name: 'OpenAI API key', regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'GitHub PAT', regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { name: 'Anthropic API key', regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'AWS Access Key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Private Key Header', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
];

const PII_PATTERNS = [
  { name: 'Personal email address', regex: /\b[A-Za-z0-9._%+-]+@(?!example\.com\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { name: 'Belgian/Dutch phone number', regex: /\b(?:\+32|\+31|0032|0031)[\s.-]?\d{1,3}(?:[\s.-]?\d{2,4}){2,3}\b/g }
];

export function sanitizeExternalText(input, maxLength = 600) {
  if (typeof input !== 'string') return '';
  let clean = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ');
  for (const pattern of INJECTION_PATTERNS) {
    clean = clean.replace(pattern, '[REDACTED_INJECTION]');
  }
  return clean.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function scanForLeaks(text, { allowExampleDomain = true } = {}) {
  const findings = [];
  if (typeof text !== 'string') return findings;

  for (const { name, regex } of SECRET_PATTERNS) {
    regex.lastIndex = 0;
    const matches = text.match(regex);
    if (matches) {
      findings.push({ type: 'secret', name, count: matches.length });
    }
  }

  for (const { name, regex } of PII_PATTERNS) {
    regex.lastIndex = 0;
    const matches = text.match(regex);
    if (matches) {
      const filtered = allowExampleDomain
        ? matches.filter((m) => !m.endsWith('@example.com'))
        : matches;
      if (filtered.length > 0) {
        findings.push({ type: 'pii', name, count: filtered.length });
      }
    }
  }

  return findings;
}

export function normalizeTextKey(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
