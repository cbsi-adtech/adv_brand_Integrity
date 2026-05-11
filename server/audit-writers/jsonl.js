import { appendFile } from 'node:fs/promises';

export function createJsonlWriter(path) {
  return {
    async append(entry) {
      const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
      await appendFile(path, line, 'utf8');
    },
  };
}
