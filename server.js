const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public')); // serve static files from the public directory

let users = {}; // store user connections

io.on('connection', (socket) => {
  console.log('New user connected');

  // handle user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
    delete users[socket.id];
  });

  // handle drawing data from clients
  socket.on('draw', (data) => {
    console.log('Received drawing data from client');
    // broadcast drawing data to all connected clients
    io.emit('draw', data);
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});