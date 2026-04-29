import 'dotenv/config';
import express from 'express';
import { createFwClient } from './fw.js';
import { createRouter } from './routes.js';

const environment = process.env.FW_ENVIRONMENT || 'staging';

const fw = createFwClient({
  url: process.env.FW_MCP_URL,
  username: process.env.FW_USERNAME,
  password: process.env.FW_PASSWORD,
  environment,
});

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api', createRouter({ fw, environment }));

const port = Number(process.env.BFF_PORT) || 8787;

(async () => {
  try {
    await fw.login();
    console.log('FW login OK');
  } catch (err) {
    console.error('FW login FAILED on startup:', err.message);
  }
  app.listen(port, '127.0.0.1', () => {
    console.log(`BFF listening on http://127.0.0.1:${port}`);
    console.log(`FW environment: ${environment}`);
  });
})();
