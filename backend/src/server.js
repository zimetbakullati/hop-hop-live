const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const videoRoutes = require('./routes/videos');
const liveRoutes = require('./routes/live');
const notificationRoutes = require('./routes/notifications');
const registerSocketHandlers = require('./sockets');

dotenv.config();

const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ['GET', 'POST']
  }
});

io.use((socket, next) => {
  const rawToken = socket.handshake.auth?.token;
  if (!rawToken) {
    return next();
  }

  const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = decoded.userId;
    next();
  } catch (_error) {
    next(new Error('Unauthorized socket'));
  }
});

registerSocketHandlers(io);

app.use(cors({ origin: clientOrigin }));
app.use(express.json());
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use('/uploads', express.static(uploadsPath));
app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  });
