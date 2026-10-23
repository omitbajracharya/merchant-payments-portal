/**
 * Real-Time Socket.IO Server for PayGate Underwriting Portal
 * Run with: npm run socket-server
 */
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'PayGate Socket.IO Gateway Online', port: PORT }));
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

console.log(`\n======================================================`);
console.log(`⚡ PayGate Socket.IO Real-Time Gateway Starting...`);
console.log(`======================================================`);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.emit('connection:ack', {
    message: 'Connected to PayGate Underwriting Real-Time Event Stream',
    clientId: socket.id,
    timestamp: new Date().toISOString(),
  });

  // Client subscribes to a specific application ID
  socket.on('subscribe:application', (data) => {
    console.log(`[Socket.IO] Client ${socket.id} subscribed to application:`, data.applicationId);
    socket.join(`app_${data.applicationId}`);
  });

  // Client broadcasts an update (e.g. status changed, reviewer assigned)
  socket.on('application:update', (event) => {
    console.log(`[Socket.IO] Broadcast application update:`, event.applicationNumber, event.newStatus);
    socket.broadcast.emit('application:status_changed', event);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Periodic mock broadcast demonstrating real-time pipeline to all connected clients
const mockEvents = [
  {
    type: 'STATUS_CHANGE',
    applicationId: 'app_1002',
    applicationNumber: 'APP-1002',
    merchantName: 'Nova Artisan Coffee Roasters Inc',
    newStatus: 'UNDER_REVIEW',
    message: 'Underwriting review started for Nova Coffee Roasters',
  },
  {
    type: 'RISK_ALERT',
    applicationId: 'app_1004',
    applicationNumber: 'APP-1004',
    merchantName: 'Vanguard Digital Assets',
    newStatus: 'INFO_REQUESTED',
    message: 'FinCEN MSB registration verified by risk reviewer',
  },
  {
    type: 'STATUS_CHANGE',
    applicationId: 'app_1001',
    applicationNumber: 'APP-1001',
    merchantName: 'Apex Mountain Goods LLC',
    newStatus: 'APPROVED',
    message: 'Apex Mountain Goods approved with 2-day rolling settlement',
  },
];

let eventIndex = 0;
setInterval(() => {
  if (io.engine.clientsCount > 0) {
    const event = {
      ...mockEvents[eventIndex % mockEvents.length],
      timestamp: new Date().toISOString(),
    };
    eventIndex++;
    console.log(`[Socket.IO] Emitting live status update to ${io.engine.clientsCount} clients:`, event.applicationNumber);
    io.emit('application:status_changed', event);
  }
}, 25000);

server.listen(PORT, () => {
  console.log(`✔ Socket.IO server running on http://localhost:${PORT}`);
  console.log(`✔ Frontend will automatically connect to ws://localhost:${PORT}`);
  console.log(`======================================================\n`);
});

