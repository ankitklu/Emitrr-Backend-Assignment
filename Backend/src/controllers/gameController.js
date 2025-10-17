const Game = require('../models/Game');
const gameService = require('../services/gameService');
const matchmakingService = require('../services/matchmakingService');

const getPlayerGames = async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const games = await Game.find({
      $or: [
        { player1: username },
        { player2: username }
      ]
    })
    .sort({ endedAt: -1 })
    .limit(limit)
    .select('gameId player1 player2 winner isDraw moves startedAt endedAt');
    
    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    console.error('Error fetching player games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games'
    });
  }
};

const getActiveGamesCount = (req, res) => {
  try {
    const count = gameService.getActiveGamesCount();
    
    res.json({
      success: true,
      data: {
        activeGames: count
      }
    });
  } catch (error) {
    console.error('Error fetching active games count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active games count'
    });
  }
};


const getQueueStatus = (req, res) => {
  try {
    const queueSize = matchmakingService.getQueueSize();
    const waitingPlayers = matchmakingService.getAllWaitingPlayers();
    
    res.json({
      success: true,
      data: {
        queueSize,
        players: waitingPlayers.map(p => p.username)
      }
    });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queue status'
    });
  }
};

module.exports = {
  getPlayerGames,
  getActiveGamesCount,
  getQueueStatus
};