const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const os = require('os');

const BOARD_SIZE = 15;
const WIN_CONDITION = 5;
const MAX_PLAYERS_PER_ROOM = 2;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};
