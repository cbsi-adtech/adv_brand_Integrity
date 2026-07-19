// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readRecent } from '../audit-read.js';

let dir;
let file;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'audit-read-'));
  file = join(dir, 'audit.log');
});

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('readRecent', () => {
  it('returns [] for missing file', async () => {
    expect(await readRecent(join(dir, 'nope.log'), 50)).toEqual([]);
  });

  it('returns [] for empty file', async () => {
    writeFileSync(file, '');
    expect(await readRecent(file, 50)).toEqual([]);
  });

  it('returns last N entries newest-first', async () => {
    const lines = [];
    for (let i = 0; i < 5; i++) lines.push(JSON.stringify({ n: i }));
    writeFileSync(file, lines.join('\n') + '\n');
    const entries = await readRecent(file, 3);
    expect(entries.map((e) => e.n)).toEqual([4, 3, 2]);
  });

  it('skips malformed JSON lines', async () => {
    const lines = [JSON.stringify({ a: 1 }), 'not-json', JSON.stringify({ b: 2 })];
    writeFileSync(file, lines.join('\n') + '\n');
    const entries = await readRecent(file, 10);
    expect(entries.map((e) => Object.keys(e)[0])).toEqual(['b', 'a']);
  });

  it('returns all entries when fewer than limit exist', async () => {
    writeFileSync(file, JSON.stringify({ a: 1 }) + '\n');
    const entries = await readRecent(file, 50);
    expect(entries).toHaveLength(1);
  });
});
