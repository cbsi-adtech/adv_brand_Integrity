import { Router } from 'express';
import { getIndustryPayload } from './industries.js';

export function createRouter({ fw, environment }) {
  const router = Router();

  router.get('/health', (req, res) => {
    res.json({
      environment,
      loggedIn: Boolean(fw.sessionId),
      sessionEstablishedAt: fw.sessionEstablishedAt,
    });
  });

  router.get('/industries', (req, res) => {
    res.json(getIndustryPayload());
  });

  return router;
}
