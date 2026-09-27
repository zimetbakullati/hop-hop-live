const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/test', auth, (req, res) => {
  req.io.to(req.user.userId).emit('notification', {
    type: 'test',
    message: 'Realtime notifications are working.'
  });
  res.json({ message: 'Notification sent' });
});

module.exports = router;
