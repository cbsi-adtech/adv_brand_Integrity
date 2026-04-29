import 'dotenv/config';
import express from 'express';
import { createRouter } from './routes.js';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api', createRouter());

const port = Number(process.env.BFF_PORT) || 8787;
app.listen(port, () => {
  console.log(`BFF listening on http://localhost:${port}`);
  console.log(`FW environment: ${process.env.FW_ENVIRONMENT || '(unset)'}`);
});
