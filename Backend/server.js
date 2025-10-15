const app = require('./src/app');
const http = require('http');
const { initializeSocket } = require('./src/socket/socketHandlers');

const server = http.createServer(app);
const io = initializeSocket(server);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});