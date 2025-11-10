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
    }
    setupEventListeners() {
       
        this.createRoomBtn.addEventListener('click', () => {
            this.openModal(this.createRoomModal);
            this.createPlayerNameInput.focus();
        });

        this.confirmCreateRoom.addEventListener('click', () => {
            const playerName = this.createPlayerNameInput.value.trim();
            if (!playerName) {
                this.showNotification('Vui lòng nhập tên của bạn', 'error');
                return;
            }
            this.socket.emit('createRoom', { playerName });
            this.createPlayerNameInput.value = '';
            this.closeModal(this.createRoomModal);
        });

        this.cancelCreateRoom.addEventListener('click', () => {
            this.closeModal(this.createRoomModal);
            this.createPlayerNameInput.value = '';
        });

        // Join room flow
        this.joinRoomBtn.addEventListener('click', () => {
            this.openModal(this.joinRoomModal);
            this.joinPlayerNameInput.focus();
        });

        this.confirmJoinRoom.addEventListener('click', () => {
            const playerName = this.joinPlayerNameInput.value.trim();
            const roomId = this.joinRoomIdInput.value.trim().toUpperCase();

            if (!playerName || !roomId) {
                this.showNotification('Vui lòng nhập tên và mã phòng', 'error');
                return;
            }

            this.socket.emit('joinRoom', { playerName, roomId });
            this.joinPlayerNameInput.value = '';
            this.joinRoomIdInput.value = '';
            this.closeModal(this.joinRoomModal);
        });

        this.cancelJoinRoom.addEventListener('click', () => {
            this.closeModal(this.joinRoomModal);
            this.joinPlayerNameInput.value = '';
            this.joinRoomIdInput.value = '';
        });

        // Reset game
        this.resetBtn.addEventListener('click', () => {
            if (!this.roomId) {
                this.showNotification('Bạn cần tham gia phòng trước khi reset', 'error');
                return;
            }
            this.socket.emit('resetGame');
        });

        if (this.leaveRoomBtn) {
            this.leaveRoomBtn.addEventListener('click', () => {
                if (!this.roomId) {
                    this.showNotification('Bạn chưa tham gia phòng', 'error');
                    return;
                }
                this.socket.emit('leaveRoom');
            });
        }

        // Game over modal
        this.playAgain.addEventListener('click', () => {
            if (!this.roomId) {
                this.gameOverModal.style.display = 'none';
                return;
            }
            this.socket.emit('resetGame');
            this.gameOverModal.style.display = 'none';
        });

        this.closeGameOver.addEventListener('click', () => {
            this.gameOverModal.style.display = 'none';
        });

        // Chat
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.createRoomModal) {
                this.closeModal(this.createRoomModal);
            }
            if (e.target === this.joinRoomModal) {
                this.closeModal(this.joinRoomModal);
            }
            if (e.target === this.gameOverModal) {
                this.gameOverModal.style.display = 'none';
            }
        });

        if (this.copyRoomIdBtn) {
            this.copyRoomIdBtn.addEventListener('click', () => {
                if (!this.roomId) {
                    this.showNotification('Chưa có mã phòng để sao chép', 'error');
                    return;
                }

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(this.roomId)
                        .then(() => this.showNotification(`Đã sao chép mã phòng ${this.roomId}`))
                        .catch(() => this.showNotification('Không thể sao chép mã phòng', 'error'));
                } else {
                    this.showNotification('Trình duyệt không hỗ trợ sao chép tự động', 'error');
                }
            });
        }
    }

    
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
