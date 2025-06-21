const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());



const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});


// In-memory stores
const rooms = {};
const canvasHistory = {};
const roomUsers = {};


io.engine.on("connection_error", (err) => {
  console.error("Socket.IO connection error:", err);
});

io.on('connection', socket => {
  console.log(`🟢 User connected: ${socket.id}`);

  socket.on('create-room', ({ roomId, isPrivate, allowedUsers = [], creatorUsername }) => {
    if (!roomId || typeof roomId !== 'string') {
      return socket.emit('error', { message: 'Invalid roomId' });
    }

    if (rooms[roomId]) {
      return socket.emit('room-exists', { message: 'Room already exists.' });
    }

    const cleanCreator = creatorUsername?.trim().toLowerCase();
    if (isPrivate && cleanCreator) {
      const exists = allowedUsers.some(
        u => u.username?.trim().toLowerCase() === cleanCreator
      );
      if (!exists) {
        allowedUsers.push({ username: cleanCreator, permission: 'owner' });
      }
    }

    rooms[roomId] = { isPrivate: !!isPrivate, allowedUsers };
    canvasHistory[roomId] = [];
    roomUsers[roomId] = [];

    console.log(`✅ Room created: ${roomId} (${isPrivate ? 'Private' : 'Public'})`);
    socket.emit('room-created', { roomId });
  });

  socket.on('join-room', ({ roomId, username, isCreator }) => {
    if (!roomId || !username) {
      return socket.emit('access-denied', { message: 'Missing room or username.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const room = rooms[roomId];

    if (!room) {
      return socket.emit('access-denied', { message: 'Room does not exist.' });
    }

    let user = room.allowedUsers.find(
      u => u.username?.trim().toLowerCase() === cleanUsername
    );

    if (!user && isCreator) {
      user = { username: cleanUsername, permission: 'owner' };
      room.allowedUsers.push(user);
    }

    if (!user) {
      user = { username: cleanUsername, permission: 'view' };
      room.allowedUsers.push(user);
    }

    socket.join(roomId);
    socket.emit('set-permission', { permission: user.permission });

    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    roomUsers[roomId].push({ username: cleanUsername, socketId: socket.id });

    io.to(roomId).emit('user-list', roomUsers[roomId]);
    socket.to(roomId).emit('user-joined', { username: cleanUsername });

    const history = canvasHistory[roomId] || [];
    socket.emit('canvas-history', history);

    console.log(`✅ ${cleanUsername} joined room ${roomId} (${user.permission})`);
    console.log(`📤 Sending canvas history to ${cleanUsername}:`, history.length);
  });

  socket.on('draw-action', ({ roomId, action }) => {
    if (!roomId || !action) return;

    canvasHistory[roomId] = canvasHistory[roomId] || [];
    canvasHistory[roomId].push(action);

    socket.to(roomId).emit('draw-action', action);
    socket.to(roomId).emit('user-is-drawing', { socketId: socket.id });
  });

  socket.on('clear-canvas', (roomId) => {
    if (!roomId) return;

    canvasHistory[roomId] = [];
    socket.to(roomId).emit('clear-canvas');
    console.log(`🧹 Canvas cleared for room: ${roomId}`);
  });


  socket.on('disconnecting', () => {
    const joinedRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    joinedRooms.forEach(roomId => {
      if (roomUsers[roomId]) {
        roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
        io.to(roomId).emit('user-list', roomUsers[roomId]);
        socket.to(roomId).emit('user-left', { socketId: socket.id });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => {
  console.log('🚀 Server listening on port 5000');
});
