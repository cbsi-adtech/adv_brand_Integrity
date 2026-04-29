import { Router } from 'express';

export function createRouter() {
  const router = Router();

  router.get('/health', (req, res) => {
    res.json({
      environment: process.env.FW_ENVIRONMENT || 'unknown',
      loggedIn: false,
      sessionExpiresAt: null,
      error: 'not yet implemented',
    });
  });

  return router;
}
