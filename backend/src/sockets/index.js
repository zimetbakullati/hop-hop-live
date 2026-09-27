const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.on('join:user', (userId) => {
      socket.join(userId);
    });

    socket.on('live:join-room', (roomId) => {
      socket.join(roomId);
      io.to(roomId).emit('live:viewer-update', { roomId, action: 'join' });
    });

    socket.on('live:leave-room', (roomId) => {
      socket.leave(roomId);
      io.to(roomId).emit('live:viewer-update', { roomId, action: 'leave' });
    });
  });
};

module.exports = registerSocketHandlers;
