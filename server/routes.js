import { Router } from 'express';

export function createRouter({ fw, environment }) {
  const router = Router();

  router.get('/health', (req, res) => {
    res.json({
      environment,
      loggedIn: Boolean(fw.sessionId),
      sessionEstablishedAt: fw.sessionEstablishedAt,
    });
  });

  return router;
}
