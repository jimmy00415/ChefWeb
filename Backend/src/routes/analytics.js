import { Router } from 'express';
import { db, createId } from '../storage.js';

const router = Router();

router.post('/video', (req, res) => {
  const payload = req.body || {};
  db.analytics.push({ id: createId('evt'), ...payload, createdAt: new Date().toISOString() });
  return res.status(201).json({ ok: true });
});

export default router;
