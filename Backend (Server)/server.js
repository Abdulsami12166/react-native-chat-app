// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatapp';
mongoose.connect(MONGO).then(() => console.log('MongoDB connected')).catch(err => console.error(err));

app.use('/auth', authRoutes);
app.use('/conversations', chatRoutes);

// userSockets: map userId -> Set of socketIds
const userSockets = new Map();

// helper to add socket for user
function addSocketForUser(userId, socketId) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socketId);
}

// helper to remove socket for user
function removeSocketForUser(userId, socketId) {
  if (!userSockets.has(userId)) return;
  userSockets.get(userId).delete(socketId);
  if (userSockets.get(userId).size === 0) userSockets.delete(userId);
}

// send to all sockets of a user
function emitToUser(userId, event, payload) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  for (const sid of sockets) {
    io.to(sid).emit(event, payload);
  }
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // Client should emit 'auth' with token after connect
  socket.on('auth', (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id.toString();
      addSocketForUser(socket.userId, socket.id);

      // notify presence to everyone (or you can send only to friends)
      io.emit('presence:update', Array.from(userSockets.keys())); // list of userIds
      io.emit('user:status', { userId: socket.userId, online: true });

      console.log('socket auth ok for user', socket.userId);
    } catch (err) {
      console.log('socket auth failed', err?.message);
    }
  });

  // support explicit presence request
  socket.on('presence:get', () => {
    socket.emit('presence:update', Array.from(userSockets.keys()));
  });

  // user:online (optional duplicate for some clients)
  socket.on('user:online', (userId) => {
    if (!userId) return;
    addSocketForUser(userId, socket.id);
    io.emit('user:status', { userId, online: true });
  });

  // message:send -> save, mark delivered as appropriate, emit message:new
  socket.on('message:send', async ({ to, content }) => {
    try {
      if (!socket.userId) return;
      const from = socket.userId;
      const msg = await Message.create({
        from,
        to,
        content,
        delivered: false,
        read: false,
      });

      // If recipient online -> mark delivered true immediately and notify recipient
      if (userSockets.has(to.toString())) {
        msg.delivered = true;
        await msg.save();
        emitToUser(to.toString(), 'message:new', msg);
      }

      // Always emit back to sender (confirmation)
      emitToUser(from.toString(), 'message:new', msg);
    } catch (err) {
      console.error('error saving message', err);
    }
  });

  // typing start/stop
  socket.on('typing:start', ({ to }) => {
    if (!socket.userId) return;
    emitToUser(to.toString(), 'typing:start', { from: socket.userId });
  });
  socket.on('typing:stop', ({ to }) => {
    if (!socket.userId) return;
    emitToUser(to.toString(), 'typing:stop', { from: socket.userId });
  });

  // message read: payload can be { messageId } or array of ids
  socket.on('message:read', async (payload) => {
    try {
      if (!socket.userId) return;
      const ids = Array.isArray(payload) ? payload : [payload];
      await Message.updateMany({ _id: { $in: ids } }, { $set: { read: true } });

      // notify both sides (sender and reader)
      for (const id of ids) {
        const msg = await Message.findById(id);
        if (!msg) continue;
        emitToUser(msg.from.toString(), 'message:read', { messageId: id, reader: socket.userId });
        emitToUser(msg.to.toString(), 'message:read', { messageId: id, reader: socket.userId });
      }
    } catch (err) {
      console.error('message:read error', err);
    }
  });

  socket.on('disconnect', () => {
    const uid = socket.userId;
    if (uid) {
      removeSocketForUser(uid, socket.id);
      // broadcast offline status
      io.emit('user:status', { userId: uid, online: userSockets.has(uid) });
      io.emit('presence:update', Array.from(userSockets.keys()));
    }
    console.log('socket disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
