const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

const waitingUsers = new Set();
const activeRooms = new Map(); // Maps roomId to array of user socket IDs

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('searchMatch', () => {
    if (waitingUsers.has(socket.id)) return;

    if (waitingUsers.size > 0) {
      const partner = waitingUsers.values().next().value;
      waitingUsers.delete(partner);
      
      const roomId = `room_${partner}_${socket.id}`;
      socket.join(roomId);
      io.sockets.sockets.get(partner).join(roomId);
      
      activeRooms.set(roomId, [partner, socket.id]);
      
      io.to(roomId).emit('matchFound', { roomId });
    } else {
      waitingUsers.add(socket.id);
      socket.emit('searching');
    }
  });

  socket.on('draw', (data) => {
    const roomId = Array.from(socket.rooms).find(room => room.startsWith('room_'));
    if (roomId) {
      socket.to(roomId).emit('draw', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    waitingUsers.delete(socket.id);
    
    for (const [roomId, users] of activeRooms) {
      if (users.includes(socket.id)) {
        const partner = users.find(id => id !== socket.id);
        if (partner) {
          io.to(partner).emit('partnerDisconnected');
        }
        activeRooms.delete(roomId);
        break;
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});