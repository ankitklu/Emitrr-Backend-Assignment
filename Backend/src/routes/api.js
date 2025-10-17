const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const gameController = require('../controllers/gameController');

router.get('/leaderboard', leaderboardController.getLeaderboard);
router.get('/leaderboard/:username', leaderboardController.getPlayerStats);

router.get('/games/:username', gameController.getPlayerGames);
router.get('/games/active/count', gameController.getActiveGamesCount);
router.get('/games/queue/status', gameController.getQueueStatus);

module.exports = router;