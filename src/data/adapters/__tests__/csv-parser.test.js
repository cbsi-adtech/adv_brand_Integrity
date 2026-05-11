import { describe, it, expect } from 'vitest';
import { parseCsv, splitCsvLine } from '../csv-parser.js';

describe('splitCsvLine', () => {
  it('splits simple comma rows', () => {
    expect(splitCsvLine('a,b,c', ',')).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted fields with embedded commas', () => {
    expect(splitCsvLine('a,"b,c",d', ',')).toEqual(['a', 'b,c', 'd']);
  });

  it('handles doubled-quote escapes inside quoted fields', () => {
    expect(splitCsvLine('"a ""b"" c"', ',')).toEqual(['a "b" c']);
  });

  it('handles thousands-separated numbers in quotes', () => {
    expect(splitCsvLine('Life360,1378215,Tech,63.90,"2,779"', ',')).toEqual([
      'Life360', '1378215', 'Tech', '63.90', '2,779',
    ]);
  });

  it('supports tab delimiter', () => {
    expect(splitCsvLine('a\tb\tc', '\t')).toEqual(['a', 'b', 'c']);
  });
});

describe('parseCsv', () => {
  it('parses header + rows into objects', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    expect(parseCsv(csv)).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
  });

  it('auto-detects tab delimiter', () => {
    const tsv = 'name\tage\nAlice\t30';
    expect(parseCsv(tsv)).toEqual([{ name: 'Alice', age: 30 }]);
  });

  it('coerces numeric strings; preserves strings with non-numeric chars', () => {
    const csv = 'k,v\nx,42\ny,hello\nz,';
    expect(parseCsv(csv)).toEqual([
      { k: 'x', v: 42 },
      { k: 'y', v: 'hello' },
      { k: 'z', v: null },
    ]);
  });

  it('parses thousands-separated quoted numbers as strings (caller decides coercion)', () => {
    const csv = 'k,v\na,"2,779"';
    expect(parseCsv(csv)).toEqual([{ k: 'a', v: '2,779' }]);
  });

  it('returns [] for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });

  it('accepts an explicit firstDataLine offset (for reports with metadata header)', () => {
    const csv = 'metadata\nmore metadata\nname,age\nAlice,30';
    expect(parseCsv(csv, { firstDataLine: 2 })).toEqual([{ name: 'Alice', age: 30 }]);
  });
});
