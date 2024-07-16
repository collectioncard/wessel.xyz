const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);


const io = require('socket.io')(server, {
  cors: {
    origin: "*", // Adjust according to your needs for security
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// Serve your static files (React build)
app.use(express.static('build'));

// Sticky notes data structure
let stickyNotes = [];

// Handle socket connection
io.on('connection', (socket) => {
    console.log('New client connected');
    console.log('Sending sticky notes to client' + stickyNotes);

    // Send current sticky notes to just connected client
    socket.emit('updateNotes', stickyNotes);

    // Listen for addNote event from clients
    socket.on('addNote', (note) => {
        stickyNotes.push(note);
        io.emit('updateNotes', stickyNotes); // Update all clients
        console.log('New note added: ' + note);
    });

    // Listen for removeNote event from clients
    socket.on('removeNote', (noteId) => {
        stickyNotes = stickyNotes.filter(note => note.id !== noteId);
        io.emit('updateNotes', stickyNotes); // Update all clients
        console.log('Note removed: ' + noteId);
    });

    // Listen for updateNote event from clients (for position, content changes)
    socket.on('updateNote', (updatedNote) => {
        stickyNotes = stickyNotes.map(note => note.id === updatedNote.id ? updatedNote : note);
        io.emit('updateNotes', stickyNotes); // Update all clients
        console.log('Note updated: ' + updatedNote);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));