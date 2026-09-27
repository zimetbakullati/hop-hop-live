const { getLiveSession } = require('../liveSessions');

const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    if (socket.data.userId) {
      socket.join(socket.data.userId);
    }

    socket.on('live:join-room', (roomId) => {
      if (!socket.data.userId || !getLiveSession(roomId)) {
        return;
      }
      socket.join(roomId);
      io.to(roomId).emit('live:viewer-update', { roomId, action: 'join' });
    });

    socket.on('live:leave-room', (roomId) => {
      if (!socket.data.userId || !getLiveSession(roomId)) {
        return;
      }
      socket.leave(roomId);
      io.to(roomId).emit('live:viewer-update', { roomId, action: 'leave' });
    });
  });
};

module.exports = registerSocketHandlers;
