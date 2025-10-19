require('dotenv').config();
const socketIo = require('socket.io');
// Handlers for socket events (joinQueue, makeMove, disconnect)
const socketEvents = require('./socketHandlers');

let io;


const initializeSocket = (server) => {
  let FRONTEND_URL = process.env.FRONTEND_URL;
  io = socketIo(server, {
    cors: {
      origin: FRONTEND_URL,
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Handle join queue
    socket.on('joinQueue', (data) => {
      socketEvents.handleJoinQueue(socket, io, data);
    });

    // Handle make move
    socket.on('makeMove', (data) => {
      socketEvents.handleMakeMove(socket, io, data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      socketEvents.handleDisconnect(socket, io);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};