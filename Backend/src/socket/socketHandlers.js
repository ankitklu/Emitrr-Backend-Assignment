const gameService = require('../services/gameService');
const matchmakingService = require('../services/matchmakingService');
const { isValidMove, makeMove, checkWin, isBoardFull } = require('../utils/gameLogic');

// when players join the queeue
const handleJoinQueue = async (socket, io, { username }) => {
  console.log(`${username} joining queue`);
  
  // Check if player is reconnecting to an existing game
  const existingGame = gameService.getPlayerGame(username);
  
  if (existingGame) {
    const { gameId, game } = existingGame;
    gameService.setPlayerSocket(username, socket.id);
    socket.join(gameId);
    
    gameService.clearDisconnectionTimeout(username);

    socket.emit('gameRejoined', {
      gameId,
      board: game.board,
      currentTurn: game.currentTurn,
      player1: game.player1,
      player2: game.player2,
      playerNumber: game.player1 === username ? 1 : 2
    });
    
    return;
  }

  gameService.setPlayerSocket(username, socket.id);
  
  const waitingPlayer = matchmakingService.getWaitingPlayer(username);
  
  if (waitingPlayer) {
    matchmakingService.removeFromQueue(waitingPlayer.username);
    
    const game = gameService.createGame(waitingPlayer.username, username);
    
    socket.join(game.gameId);
    io.sockets.sockets.get(waitingPlayer.socketId).join(game.gameId);
    
    io.to(game.gameId).emit('gameStart', {
      gameId: game.gameId,
      player1: game.player1,
      player2: game.player2,
      board: game.board,
      currentTurn: game.currentTurn,
      analytics: {
        event: 'game_started',
        gameId: game.gameId,
        matchType: 'pvp'
      }
    });
    
    io.to(waitingPlayer.socketId).emit('playerNumber', { playerNumber: 1 });
    io.to(socket.id).emit('playerNumber', { playerNumber: 2 });
    
  } else {
    // Add to waiting queue
    matchmakingService.addToQueue(username, socket.id, () => {
      
      matchmakingService.removeFromQueue(username);
      
      const game = gameService.createGame(username, 'Bot');
      socket.join(game.gameId);
      
      socket.emit('gameStart', {
        gameId: game.gameId,
        player1: game.player1,
        player2: game.player2,
        board: game.board,
        currentTurn: game.currentTurn,
        analytics: {
          event: 'game_started',
          gameId: game.gameId,
          matchType: 'bot'
        }
      });
      
      socket.emit('playerNumber', { playerNumber: 1 });
    });
    
    socket.emit('waitingForOpponent');
  }
};

// when player makes a move
const handleMakeMove = async (socket, io, { gameId, col, username }) => {
  const game = gameService.getGame(gameId);
  
  if (!game || game.gameOver) {
    socket.emit('error', { message: 'Game not found or already over' });
    return;
  }

  const playerNumber = game.player1 === username ? 1 : 2;
  
  if (game.currentTurn !== playerNumber) {
    socket.emit('error', { message: 'Not your turn' });
    return;
  }

  if (!isValidMove(game.board, col)) {
    socket.emit('error', { message: 'Invalid move' });
    return;
  }

  // Make the move
  const row = makeMove(game.board, col, playerNumber);
  game.moves++;

  const moveData = {
    row,
    col,
    player: playerNumber,
    board: game.board,
    analytics: {
      event: 'move_made',
      gameId,
      player: username,
      moveNumber: game.moves
    }
  };

  io.to(gameId).emit('moveMade', moveData);

  // Check for win
  if (checkWin(game.board, row, col, playerNumber)) {
    game.gameOver = true;
    await endGameAndNotify(io, gameId, username, false);
    return;
  }

  // Check for draw
  if (isBoardFull(game.board)) {
    game.gameOver = true;
    await endGameAndNotify(io, gameId, null, true);
    return;
  }

  // Switch turn
  game.currentTurn = game.currentTurn === 1 ? 2 : 1;
  io.to(gameId).emit('turnChange', { currentTurn: game.currentTurn });

  // Bot's turn
  if (game.player2 === 'Bot' && game.currentTurn === 2) {
    setTimeout(async () => {
      await handleBotMove(io, game);
    }, 500 + Math.random() * 500);
  }
};

// when bot makes the move
const handleBotMove = async (io, game) => {
  if (game.gameOver) return;
  
  const botCol = game.bot.getBestMove(game.board);
  const botRow = makeMove(game.board, botCol, 2);
  game.moves++;

  const botMoveData = {
    row: botRow,
    col: botCol,
    player: 2,
    board: game.board,
    analytics: {
      event: 'bot_move',
      gameId: game.gameId,
      moveNumber: game.moves
    }
  };

  io.to(game.gameId).emit('moveMade', botMoveData);

  // Check for bot win
  if (checkWin(game.board, botRow, botCol, 2)) {
    game.gameOver = true;
    await endGameAndNotify(io, game.gameId, 'Bot', false);
    return;
  }

  // Check for draw
  if (isBoardFull(game.board)) {
    game.gameOver = true;
    await endGameAndNotify(io, game.gameId, null, true);
    return;
  }

  // Switch turn back to player
  game.currentTurn = 1;
  io.to(game.gameId).emit('turnChange', { currentTurn: game.currentTurn });
};

//when the game ends and we haevb to notify
const endGameAndNotify = async (io, gameId, winner, isDraw) => {
  try {
    const game = await gameService.endGame(gameId, winner, isDraw);
    
    if (!game) return;

    const gameOverData = {
      winner,
      isDraw,
      board: game.board,
      analytics: {
        event: 'game_ended',
        gameId,
        winner,
        isDraw,
        moves: game.moves,
        duration: game.endedAt - game.startedAt
      }
    };

    io.to(gameId).emit('gameOver', gameOverData);
  } catch (error) {
    console.error('Error ending game:', error);
  }
};

// when a player is disconnexcted
const handleDisconnect = (socket) => {
  console.log('Player disconnected:', socket.id);
  
  const disconnectedUsername = gameService.getPlayerBySocket(socket.id);

  if (!disconnectedUsername) return;

  // Remove from waiting queue
  matchmakingService.removeFromQueue(disconnectedUsername);

  // Handle active game disconnection
  const existingGame = gameService.getPlayerGame(disconnectedUsername);
  
  if (existingGame) {
    const { gameId, game } = existingGame;
    
    const timeout = setTimeout(async () => {
      // Player didn't reconnect, terminate the game
      const winner = game.player1 === disconnectedUsername ? game.player2 : game.player1;
      
      game.gameOver = true;
      await gameService.endGame(gameId, winner, false);
      
      gameService.clearDisconnectionTimeout(disconnectedUsername);
      
  const io = require('./socketEvents').getIO();
      io.to(gameId).emit('gameOver', {
        winner,
        isDraw: false,
        board: game.board,
        analytics: {
          event: 'game_ended',
          gameId,
          winner,
          isDraw: false,
          reason: 'forfeit'
        }
      });
    }, gameService.RECONNECT_TIMEOUT);

    gameService.setDisconnectionTimeout(disconnectedUsername, timeout);
    
    const opponentUsername = game.player1 === disconnectedUsername ? game.player2 : game.player1;
    const opponentSocket = gameService.getPlayerSocket(opponentUsername);
    
    if (opponentSocket) {
  const io = require('./socketEvents').getIO();
      io.to(opponentSocket).emit('opponentDisconnected', {
        message: 'Opponent disconnected. They have 30 seconds to reconnect.'
      });
    }
  }
};

module.exports = {
  handleJoinQueue,
  handleMakeMove,
  handleDisconnect
};