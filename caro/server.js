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


const createEmptyBoard = () => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

function createRoom(roomId) {
    return {
        roomId,
        board: createEmptyBoard(),
        currentPlayer: 'X',
        players: {},
        gameStatus: 'waiting',
        winner: null,
        winningCells: []
    };
}

function assignSymbol(room) {
    const symbols = new Set(Object.values(room.players).map((player) => player.symbol));
    if (!symbols.has('X')) return 'X';
    if (!symbols.has('O')) return 'O';
    return null;
}

function addPlayerToRoom(socket, room, playerName) {
    const symbol = assignSymbol(room);
    if (!symbol) return null;

    const player = { name: playerName, symbol };
    room.players[socket.id] = player;
    socket.join(room.roomId);
    socket.roomId = room.roomId;

    return player;
}

function getPublicRoomState(room) {
    if (!room) return null;
    return {
        roomId: room.roomId,
        board: room.board,
        currentPlayer: room.currentPlayer,
        gameStatus: room.gameStatus,
        winner: room.winner,
        winningCells: room.winningCells,
        players: room.players
    };
}

function generateRoomId() {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let roomId;
    do {
        roomId = Array.from({ length: 6 }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
    } while (rooms[roomId]);
    return roomId;
}

function sanitizeName(name) {
    return String(name || '').trim().slice(0, 20) || null;
}
function sanitizeRoomId(roomId) {
    return String(roomId || '').trim().toUpperCase();
}

function resetRoom(room) {
    room.board = createEmptyBoard();
    room.currentPlayer = 'X';
    room.winner = null;
    room.winningCells = [];
    room.gameStatus = Object.keys(room.players).length === MAX_PLAYERS_PER_ROOM ? 'playing' : 'waiting';
}

function broadcastRoomUpdate(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    io.to(roomId).emit('gameUpdate', getPublicRoomState(room));
}

function checkWin(board, row, col, symbol) {
    const directions = [
        [0, 1],   
        [1, 0],   
        [1, 1],   
        [1, -1]   
    ];

    for (const [dx, dy] of directions) {
        const cells = [[row, col]];
        let count = 1;

  
        for (let step = 1; step < WIN_CONDITION; step++) {
            const newRow = row + step * dx;
            const newCol = col + step * dy;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol] === symbol) {
                cells.push([newRow, newCol]);
                count++;
            } else break;
        }

       
        for (let step = 1; step < WIN_CONDITION; step++) {
            const newRow = row - step * dx;
            const newCol = col - step * dy;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol] === symbol) {
                cells.unshift([newRow, newCol]);
                count++;
            } else break;
        }

        if (count >= WIN_CONDITION) return cells.slice(0, WIN_CONDITION);
    }
    return null;
}

function checkDraw(board) {
    return board.every(row => row.every(cell => cell !== null));
}

