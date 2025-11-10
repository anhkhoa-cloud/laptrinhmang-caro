class CaroGame {
    constructor() {
        this.socket = io();
        this.playerId = null;
        this.playerSymbol = null;
        this.gameState = null;
        this.isMyTurn = false;
        this.roomId = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupSocketListeners();
        this.createBoard();
        this.toggleRoomActions(false);
        this.setChatEnabled(false);
        this.updateRoomInfoUI();
        this.setLeaveRoomEnabled(false);
    }

    initializeElements() {
        this.gameBoard = document.getElementById('gameBoard');
        this.gameStatus = document.getElementById('gameStatus');
        this.currentPlayer = document.getElementById('currentPlayer');
        this.player1 = document.getElementById('player1');
        this.player2 = document.getElementById('player2');
        this.roomIdDisplay = document.getElementById('roomIdDisplay');
        this.copyRoomIdBtn = document.getElementById('copyRoomIdBtn');

        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.joinRoomBtn = document.getElementById('joinRoomBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.leaveRoomBtn = document.getElementById('leaveRoomBtn');

        this.createRoomModal = document.getElementById('createRoomModal');
        this.joinRoomModal = document.getElementById('joinRoomModal');
        this.gameOverModal = document.getElementById('gameOverModal');

        this.createPlayerNameInput = document.getElementById('createPlayerNameInput');
        this.joinPlayerNameInput = document.getElementById('joinPlayerNameInput');
        this.joinRoomIdInput = document.getElementById('joinRoomIdInput');

        this.confirmCreateRoom = document.getElementById('confirmCreateRoom');
        this.cancelCreateRoom = document.getElementById('cancelCreateRoom');
        this.confirmJoinRoom = document.getElementById('confirmJoinRoom');
        this.cancelJoinRoom = document.getElementById('cancelJoinRoom');

        this.playAgain = document.getElementById('playAgain');
        this.closeGameOver = document.getElementById('closeGameOver');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
 updateGameDisplay() {
        if (!this.gameState) {
            return;
        }

        if (this.gameState.roomId) {
            this.roomId = this.gameState.roomId;
        }
        this.updateRoomInfoUI();

        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                const cell = this.gameBoard.children[row * 15 + col];
                const value = this.gameState.board[row][col];

                cell.textContent = value || '';
                cell.className = 'cell';
                if (value) {
                    cell.classList.add(value.toLowerCase());
                }
            }
        }

        const players = this.gameState.players || {};
        const currentSymbol = this.gameState.currentPlayer;
        const currentPlayerInfo = Object.values(players).find((player) => player.symbol === currentSymbol);

        switch (this.gameState.gameStatus) {
            case 'waiting':
                this.gameStatus.textContent = 'Đang chờ người chơi...';
                this.currentPlayer.textContent = 'Lượt: Chưa xác định';
                break;
            case 'playing':
                this.gameStatus.textContent = 'Game đang diễn ra';
                if (currentPlayerInfo) {
                    this.currentPlayer.textContent = `Lượt: ${currentPlayerInfo.name} (${currentPlayerInfo.symbol})`;
                } else {
                    this.currentPlayer.textContent = `Lượt: ${currentSymbol || '...'}`;
                }
                break;
            case 'finished':
                this.gameStatus.textContent = 'Game đã kết thúc';
                if (this.gameState.winner === 'draw') {
                    this.currentPlayer.textContent = 'Kết quả: Hòa';
                } else {
                    const winnerInfo = Object.values(players).find((player) => player.symbol === this.gameState.winner);
                    if (winnerInfo) {
                        this.currentPlayer.textContent = `Người thắng: ${winnerInfo.name} (${winnerInfo.symbol})`;
                    } else {
                        this.currentPlayer.textContent = `Người thắng: ${this.gameState.winner}`;
                    }
                }
                break;
            default:
                this.gameStatus.textContent = 'Trạng thái không xác định';
                this.currentPlayer.textContent = '';
        }

        this.updatePlayersInfo(players);
    }
        updatePlayersInfo(players = {}) {
        const playerEntries = Object.values(players);
        const player1Info = playerEntries[0];
        const player2Info = playerEntries[1];

        if (player1Info) {
            this.player1.querySelector('.player-name').textContent = player1Info.name;
            this.player1.querySelector('.player-symbol').textContent = player1Info.symbol;
            this.player1.classList.toggle('active', 
                this.gameState && this.gameState.currentPlayer === player1Info.symbol);
        } else {
            this.player1.querySelector('.player-name').textContent = 'Chờ người chơi...';
            this.player1.querySelector('.player-symbol').textContent = 'X';
            this.player1.classList.remove('active');
        }

        if (player2Info) {
            this.player2.querySelector('.player-name').textContent = player2Info.name;
            this.player2.querySelector('.player-symbol').textContent = player2Info.symbol;
            this.player2.classList.toggle('active', 
                this.gameState && this.gameState.currentPlayer === player2Info.symbol);
        } else {
            this.player2.querySelector('.player-name').textContent = 'Chờ người chơi...';
            this.player2.querySelector('.player-symbol').textContent = 'O';
            this.player2.classList.remove('active');
        }
    } 
    }
  
}
