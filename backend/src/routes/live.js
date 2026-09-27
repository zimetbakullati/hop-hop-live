const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();
const liveSessions = new Map();

router.post('/start', auth, (req, res) => {
  const roomId = `${req.user.userId}-${Date.now()}`;
  const payload = {
    roomId,
    hostId: req.user.userId,
    title: req.body.title || 'Live Stream',
    startedAt: new Date().toISOString()
  };

  liveSessions.set(roomId, payload);
  req.io.emit('live:started', payload);
  res.status(201).json(payload);
});

router.post('/:roomId/end', auth, (req, res) => {
  const session = liveSessions.get(req.params.roomId);
  if (!session) {
    return res.status(404).json({ message: 'Live session not found' });
  }

  if (session.hostId !== req.user.userId) {
    return res.status(403).json({ message: 'Only the host can end this live stream' });
  }

  liveSessions.delete(req.params.roomId);
  req.io.emit('live:ended', { roomId: req.params.roomId });
  res.json({ message: 'Live stream ended' });
});

router.get('/', (_req, res) => {
  res.json(Array.from(liveSessions.values()));
});

module.exports = router;
