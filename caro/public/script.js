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

    //setupSocketListeners
    setupSocketListeners() {
        this.socket.on('roomCreated', ({ roomId }) => {
            this.roomId = roomId;
            this.toggleRoomActions(true);
            this.setChatEnabled(true);
            this.setLeaveRoomEnabled(true);
            this.clearChat();
            this.updateRoomInfoUI();
            this.showNotification(`Đã tạo phòng ${roomId}. Hãy chia sẻ mã phòng cho bạn bè!`);
        });

        this.socket.on('playerJoined', (data) => {
            this.playerId = data.playerId;
            this.playerSymbol = data.symbol;
            this.roomId = data.roomId || this.roomId;
            this.toggleRoomActions(true);
            this.setChatEnabled(true);
            this.setLeaveRoomEnabled(true);
            this.clearChat();
            this.updateRoomInfoUI();
            this.updatePlayersInfo(data.players || {});
            this.showNotification(`Bạn đã tham gia phòng ${this.roomId} với ký hiệu ${data.symbol}`);
        });

        this.socket.on('gameUpdate', (gameState) => {
            this.gameState = gameState;
            if (gameState.roomId) {
                this.roomId = gameState.roomId;
            }
            this.updateRoomInfoUI();
            this.updateGameDisplay();
        });

        this.socket.on('gameStarted', (gameState) => {
            this.gameState = gameState;
            if (gameState.roomId) {
                this.roomId = gameState.roomId;
            }
            this.updateRoomInfoUI();
            this.updateGameDisplay();
            this.showNotification('Game đã bắt đầu!');
        });

        this.socket.on('gameFinished', (data) => {
            this.highlightWinningCells(data);
            this.showGameOver(data);
        });

        this.socket.on('gameReset', (gameState) => {
            this.gameState = gameState;
            this.updateGameDisplay();
            this.clearBoard();
            this.showNotification('Phòng đã bắt đầu ván mới!');
        });

        this.socket.on('gameFull', () => {
            this.showNotification('Phòng đã đủ người!', 'error');
        });

        this.socket.on('chatMessage', (data) => {
            this.addChatMessage(data);
        });

        this.socket.on('playerLeft', ({ players, message }) => {
            this.updatePlayersInfo(players || {});
            this.updateRoomInfoUI();
            if (message) {
                this.showNotification(message, 'error');
            }
        });

        this.socket.on('roomClosed', ({ message }) => {
            this.showNotification(message || 'Phòng đã đóng.', 'error');
            this.resetClientState('Phòng đã đóng. Tạo hoặc tham gia phòng mới.');
        });

        this.socket.on('roomLeft', ({ message }) => {
            this.resetClientState('Bạn đã rời phòng. Hãy tạo hoặc tham gia phòng mới.');
            if (message) {
                this.showNotification(message);
            } else {
                this.showNotification('Bạn đã rời phòng.');
            }
        });

        this.socket.on('error', (message) => {
            this.showNotification(message, 'error');
        });

        this.socket.on('connect', () => {
            this.showNotification('Đã kết nối với server');
        });

        this.socket.on('disconnect', () => {
            this.showNotification('Mất kết nối với server', 'error');
            this.resetClientState('Mất kết nối với server.');
        });
    }

    createBoard() {
        this.gameBoard.innerHTML = '';
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                const cell = document.createElement('button');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.makeMove(row, col));
                this.gameBoard.appendChild(cell);
            }
        }
    }
    makeMove(row, col) {
        if (!this.gameState) {
            this.showNotification('Game chưa được khởi tạo', 'error');
            return;
        }
        
        if (row < 0 || row >= 15 || col < 0 || col >= 15) {
            this.showNotification('Vị trí không hợp lệ', 'error');
            return;
        }
        
        if (this.gameState.gameStatus !== 'playing') {
            this.showNotification('Game chưa bắt đầu hoặc đã kết thúc', 'error');
            return;
        }
        
        if (this.gameState.currentPlayer !== this.playerSymbol) {
            this.showNotification('Không phải lượt của bạn', 'error');
            return;
        }
        
        if (this.gameState.board[row][col] !== null) {
            this.showNotification('Ô này đã có quân', 'error');
            return;
        }

        this.socket.emit('makeMove', { row, col });
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
     highlightWinningCells(result) {
        const cells = this.gameBoard.querySelectorAll('.cell');
        cells.forEach(cell => cell.classList.remove('winning'));

        if (!result || result.winner === 'draw') {
            return;
        }

        if (Array.isArray(result.winningCells) && result.winningCells.length) {
            result.winningCells.forEach(([row, col]) => {
                const index = row * 15 + col;
                const cell = this.gameBoard.children[index];
                if (cell) {
                    cell.classList.add('winning');
                }
            });
        } else {
            cells.forEach(cell => {
                if (cell.textContent === result.winner) {
                    cell.classList.add('winning');
                }
            });
        }
    }

    showGameOver(data) {
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        
        if (data.winner === 'draw') {
            title.textContent = 'Hòa!';
            message.textContent = 'Cả hai người chơi đều xuất sắc!';
        } else {
            title.textContent = 'Game kết thúc!';
            message.textContent = `${data.winnerName} (${data.winner}) đã thắng!`;
        }
        
        this.gameOverModal.style.display = 'block';
    }

    clearBoard() {
        const cells = this.gameBoard.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!this.roomId) {
            this.showNotification('Bạn cần tham gia phòng để chat', 'error');
            return;
        }
        if (message) {
            this.socket.emit('chatMessage', { message });
            this.messageInput.value = '';
        }
    }

    addChatMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';

        const isOwnMessage = data.playerId && data.playerId === this.playerId;

        messageDiv.classList.add(isOwnMessage ? 'own' : 'other');

        const info = document.createElement('div');
        info.className = 'message-info';
        const symbol = data.symbol ? ` (${data.symbol})` : '';
        info.textContent = `${data.player}${symbol} - ${data.timestamp}`;

        const content = document.createElement('div');
        content.textContent = data.message;

        messageDiv.appendChild(info);
        messageDiv.appendChild(content);

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    updateRoomInfoUI() {
        const hasRoom = Boolean(this.roomId);
        this.roomIdDisplay.textContent = hasRoom ? this.roomId : '---';

        if (this.copyRoomIdBtn) {
            this.copyRoomIdBtn.style.visibility = hasRoom ? 'visible' : 'hidden';
            this.copyRoomIdBtn.disabled = !hasRoom;
    }
        this.setLeaveRoomEnabled(hasRoom);
    }

    toggleRoomActions(disabled) {
        this.createRoomBtn.disabled = disabled;
        this.joinRoomBtn.disabled = disabled;
    }

    setChatEnabled(enabled) {
        this.messageInput.disabled = !enabled;
        this.sendBtn.disabled = !enabled;
    }

    setLeaveRoomEnabled(enabled) {
        if (!this.leaveRoomBtn) return;
        this.leaveRoomBtn.disabled = !enabled;
        this.leaveRoomBtn.style.visibility = enabled ? 'visible' : 'hidden';
    }

    clearChat() {
        this.chatMessages.innerHTML = '';
    }

    resetClientState(statusMessage = 'Đang chờ người chơi...') {
        this.roomId = null;
        this.playerId = null;
        this.playerSymbol = null;
        this.gameState = null;
        this.toggleRoomActions(false);
        this.setChatEnabled(false);
        this.setLeaveRoomEnabled(false);
        this.clearBoard();
        this.clearChat();
        this.gameStatus.textContent = statusMessage;
        this.currentPlayer.textContent = 'Lượt: Chưa xác định';
        this.updatePlayersInfo({});
        this.updateRoomInfoUI();
    }

    openModal(modal) {
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : '#4caf50'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
    // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CaroGame();
});



