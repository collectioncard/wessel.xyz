import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

app.use(express.static('../frontend/dist'));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

console.log('Hello, worhld!');