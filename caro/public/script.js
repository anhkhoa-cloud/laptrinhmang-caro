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
        // Create room flow
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

        
    }
  
}
