// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createJsonlWriter } from '../jsonl.js';

let dir;
let file;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'audit-'));
  file = join(dir, 'audit.log');
});

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('jsonl audit writer', () => {
  it('appends one JSON line per entry', async () => {
    const writer = createJsonlWriter(file);
    await writer.append({ a: 1 });
    await writer.append({ b: 2 });
    const content = readFileSync(file, 'utf8');
    expect(content.trim().split('\n')).toHaveLength(2);
    expect(JSON.parse(content.trim().split('\n')[0])).toMatchObject({ a: 1 });
  });

  it('adds a top-level ts field to each entry', async () => {
    const writer = createJsonlWriter(file);
    await writer.append({ x: 'y' });
    const line = JSON.parse(readFileSync(file, 'utf8').trim());
    expect(line.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
