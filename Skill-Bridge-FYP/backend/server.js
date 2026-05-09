const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const config = require('./config');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Connection
mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);

// Serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Skills routes (uploads, create, list)
const skillsRoutes = require('./routes/skills');
app.use('/api/skills', skillsRoutes);

// Chat & Users
const chatRoutes = require('./routes/chat');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const projectsRoutes = require('./routes/projects');
app.use('/api/chat', chatRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

const jwt = require('jsonwebtoken');
const configFile = require('./config');
const User = require('./models/User');

// In-process presence tracking (no Redis)
// Map: email -> Set of socketIds
const localPresence = new Map();

const emitPresence = (payload) => {
  try {
    io.emit('user:presence', payload);
  } catch (e) {
    console.error('Error emitting presence:', e.message);
  }
};

// Socket.IO Connection with auth and presence handlers
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.split(' ')[1]);
  if (!token) return next(new Error('Authentication error'));
  jwt.verify(token, configFile.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded; // { id, email, ... }
    next();
  });
});

io.on('connection', async (socket) => {
  const email = socket.user?.email;
  if (!email) return socket.disconnect(true);
  console.log('Socket connected:', socket.id, 'user:', email);

  // Track socket id in local in-memory map and broadcast presence
  try {
    const presencePayload = { email, status: 'online', lastSeen: new Date().toISOString() };
    const set = localPresence.get(email) || new Set();
    set.add(socket.id);
    localPresence.set(email, set);
    emitPresence(presencePayload);
    // also update DB record
    await User.findOneAndUpdate({ email }, { availabilityStatus: 'online', lastSeen: new Date() });
  } catch (e) {
    console.error('Error setting presence on connect:', e.message);
  }

  // Handle explicit presence changes (online/away/offline)
  socket.on('presence:change', async (data) => {
    try {
      const status = data?.status || 'online';
      const presencePayload = { email, status, lastSeen: new Date().toISOString() };
      emitPresence(presencePayload);
      await User.findOneAndUpdate({ email }, { availabilityStatus: status, lastSeen: new Date() });
    } catch (e) {
      console.error('Error handling presence:change:', e.message);
    }
  });

  socket.on('disconnect', async () => {
    console.log('Socket disconnected:', socket.id, 'user:', email);
    try {
      const set = localPresence.get(email);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          localPresence.delete(email);
          const presencePayload = { email, status: 'offline', lastSeen: new Date().toISOString() };
          emitPresence(presencePayload);
          await User.findOneAndUpdate({ email }, { availabilityStatus: 'offline', lastSeen: new Date() });
        }
      }
    } catch (e) {
      console.error('Error handling disconnect presence:', e.message);
    }
  });
});

app.set('socketIO', io);

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: config.NODE_ENV === 'development' ? err.message : {},
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start Server
const PORT = config.PORT;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});

module.exports = server;
