const express = require('express');
const http = require('http');
const { dirname } = require('path');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/message');
const { addUser, removeUser, getUsers, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '../public');

app.use(express.static(publicDir));

io.on('connection', (socket) => {
    console.log('New Websocket Connection');

    socket.on('join', (options, callback) => {
        const {error, user } = addUser({id: socket.id, ...options})
        if(error) {
            return callback(error)
        }

        socket.join(user.room);

        // send message to client
        socket.emit('message', generateMessage('Admin', 'Welcome!'));

        // brodcast message when a new user joined
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    // recieve message from client and emit to all connected clients
    socket.on('sendMessage', (message, callback) => {
        const user = getUsers(socket.id)
            var filter = new Filter();  
            if(filter.isProfane(message)){
                return callback('Profanity is not allowed');
            }

            io.to(user.room).emit('message', generateMessage(user.username, message));
            callback()        
    });

    // recieve location from client and emit to all connected clients
    socket.on('shareLocation', (location, callback) => {
        const user = getUsers(socket.id)
            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`));
            callback();
    })

    // notify all connected clients when user got disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
        io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        }
    })
})

server.listen(port, () => {
    console.log('Listening at port 3000');
})