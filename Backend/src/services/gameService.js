const Game = require('../models/Game');
const PlayerStats = require('../models/PlayerStats');
const { createBoard } = require('../utils/gameLogic');
const BotAI = require('./botService');

// In-memory game state
const activeGames = new Map();
const playerSockets = new Map();
const disconnectedPlayers = new Map();

const RECONNECT_TIMEOUT = 30000;

// creating a new game upon first render or whenever a new game starts
const createGame = (player1, player2) => {
  const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const game = {
    gameId,
    player1,
    player2,
    board: createBoard(),
    currentTurn: 1,
    moves: 0,
    startedAt: new Date(),
    gameOver: false,
    bot: player2 === 'Bot' ? new BotAI(2) : null
  };
  
  activeGames.set(gameId, game);
  return game;
};

//fetching game id
const getGame = (gameId) => {
  return activeGames.get(gameId);
};

// fetching active player in the game
const getPlayerGame = (username) => {
  for (const [gameId, game] of activeGames.entries()) {
    if ((game.player1 === username || game.player2 === username) && !game.gameOver) {
      return { gameId, game };
    }
  }
  return null;
};

// updaitng the gam estate
const updateGame = (gameId, updates) => {
  const game = activeGames.get(gameId);
  if (game) {
    Object.assign(game, updates);
    activeGames.set(gameId, game);
  }
  return game;
};

// ending the game and updating the DB
const endGame = async (gameId, winner, isDraw = false) => {
  const game = activeGames.get(gameId);
  if (!game) return null;

  game.winner = winner;
  game.isDraw = isDraw;
  game.gameOver = true;
  game.endedAt = new Date();

  // Save to database
  try {
    const gameDoc = new Game({
      gameId: game.gameId,
      player1: game.player1,
      player2: game.player2,
      winner: winner,
      isDraw: isDraw,
      moves: game.moves,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      board: game.board
    });
    await gameDoc.save();

    // Update player stats
    await updatePlayerStats(game.player1, game.player2, winner, isDraw);

    // Clean up
    activeGames.delete(gameId);

    return game;
  } catch (error) {
    console.error('Error ending game:', error);
    throw error;
  }
};

// Updatign the player stats into the DB
const updatePlayerStats = async (player1, player2, winner, isDraw) => {
  try {
    if (isDraw) {
      // Both players get a draw
      await PlayerStats.findOneAndUpdate(
        { username: player1 },
        { 
          $inc: { draws: 1, gamesPlayed: 1 },
          lastPlayed: new Date()
        },
        { upsert: true, new: true }
      );
      
      if (player2 !== 'Bot') {
        await PlayerStats.findOneAndUpdate(
          { username: player2 },
          { 
            $inc: { draws: 1, gamesPlayed: 1 },
            lastPlayed: new Date()
          },
          { upsert: true, new: true }
        );
      }
    } else if (winner) {
      // Update winner
      await PlayerStats.findOneAndUpdate(
        { username: winner },
        { 
          $inc: { wins: 1, gamesPlayed: 1 },
          lastPlayed: new Date()
        },
        { upsert: true, new: true }
      );

      // Update loser
      const loser = player1 === winner ? player2 : player1;
      if (loser !== 'Bot') {
        await PlayerStats.findOneAndUpdate(
          { username: loser },
          { 
            $inc: { losses: 1, gamesPlayed: 1 },
            lastPlayed: new Date()
          },
          { upsert: true, new: true }
        );
      }
    }
  } catch (error) {
    console.error('Error updating player stats:', error);
  }
};

//game delete 
const deleteGame = (gameId) => {
  activeGames.delete(gameId);
};

// scoket management
const setPlayerSocket = (username, socketId) => {
  playerSockets.set(username, socketId);
};

const getPlayerSocket = (username) => {
  return playerSockets.get(username);
};

const removePlayerSocket = (username) => {
  playerSockets.delete(username);
};

const getPlayerBySocket = (socketId) => {
  for (const [username, sid] of playerSockets.entries()) {
    if (sid === socketId) return username;
  }
  return null;
};

// when a player disconnects, we set a timeout to allow reconnection
const setDisconnectionTimeout = (username, timeout) => {
  disconnectedPlayers.set(username, timeout);
};

const clearDisconnectionTimeout = (username) => {
  const timeout = disconnectedPlayers.get(username);
  if (timeout) {
    clearTimeout(timeout);
    disconnectedPlayers.delete(username);
  }
};

const getDisconnectionTimeout = (username) => {
  return disconnectedPlayers.get(username);
};

// getting all active games
const getAllActiveGames = () => {
  return Array.from(activeGames.values());
};

//active game count
const getActiveGamesCount = () => {
  return activeGames.size;
};

module.exports = {
  createGame,
  getGame,
  getPlayerGame,
  updateGame,
  endGame,
  deleteGame,
  setPlayerSocket,
  getPlayerSocket,
  removePlayerSocket,
  getPlayerBySocket,
  setDisconnectionTimeout,
  clearDisconnectionTimeout,
  getDisconnectionTimeout,
  getAllActiveGames,
  getActiveGamesCount,
  RECONNECT_TIMEOUT
};