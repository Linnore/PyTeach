import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const httpServer = http.createServer()

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000', // Replace with your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: [],
    credentials: true,
  },
})

io.on('connection', (socket) => {
  console.log('Socket INFO:\t', socket.id, 'connected.')

  socket.on('register', (data) => {
    var id;
    if (data.source_type == "AS") {
      id = `${data.source_type}${data.source_id}`;
    }
    else if (data.source_type == "HOST") {
      // Currently, any action from AS will be sent to all hostpages,
      // regardless of lecture which. This can be improved by providing
      // the source id of the host to the AS.
      id = `${data.source_type}`;
    }
    else {
      throw new Error('Unknown source type!')
    }
    console.log('Socket INFO:\t', socket.id, 'registered as', id);
    socket.join(id);
  });


  socket.on('disconnect', () => {
    console.log('Socket INFO:\t', socket.id, 'disconnected.');
  });

  socket.on('from_AS_to_socket', (data) => {
    console.log('Socket INFO:\t', 'AS', data.source_id, 'to socket. Task=', data.task);
    socket.to("HOST").emit("from_socket_to_host", data);
  });

  socket.on('from_host_to_socket', (data) => {
    console.log('Socket INFO:\t', 'HOST', data.source_id, 'to socket. Message=', data.message, '. Data=', data);
    socket.to(data.target_id).emit("from_socket_to_AS", data);
    io.in(data.target_id).socketsLeave(data.target_id)
  });


  // For http://localhost:3000/debug
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`user with id-${socket.id} joined room - ${roomId}`);
  });

  // For http://localhost:3000/debug
  socket.on('send_msg', (data) => {
    console.log(data, 'DATA');
    //This will send a message to a specific room ID
    socket.to(data.roomId).emit('receive_msg', data);
  });
})

const PORT = 3001
httpServer.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`)
})