import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createJsonlWriter } from './audit-writers/jsonl.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIT_PATH = resolve(__dirname, 'audit.log');

const writer = createJsonlWriter(AUDIT_PATH);

export async function appendAudit(entry) {
  await writer.append(entry);
}

export { AUDIT_PATH };
