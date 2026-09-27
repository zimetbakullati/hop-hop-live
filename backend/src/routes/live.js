const express = require('express');
const auth = require('../middleware/auth');
const { getLiveSession, setLiveSession, deleteLiveSession, listLiveSessions } = require('../liveSessions');

const router = express.Router();

router.post('/start', auth, (req, res) => {
  const roomId = `${req.user.userId}-${Date.now()}`;
  const payload = {
    roomId,
    hostId: req.user.userId,
    title: req.body.title || 'Live Stream',
    startedAt: new Date().toISOString()
  };

  setLiveSession(roomId, payload);
  req.io.emit('live:started', payload);
  res.status(201).json(payload);
});

router.post('/:roomId/end', auth, (req, res) => {
  const session = getLiveSession(req.params.roomId);
  if (!session) {
    return res.status(404).json({ message: 'Live session not found' });
  }

  if (session.hostId !== req.user.userId) {
    return res.status(403).json({ message: 'Only the host can end this live stream' });
  }

  deleteLiveSession(req.params.roomId);
  req.io.emit('live:ended', { roomId: req.params.roomId });
  res.json({ message: 'Live stream ended' });
});

router.get('/', (_req, res) => {
  res.json(listLiveSessions());
});

module.exports = router;
