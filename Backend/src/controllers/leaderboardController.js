const PlayerStats = require('../models/PlayerStats');

const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await PlayerStats.find()
      .sort({ wins: -1, gamesPlayed: 1 })
      .limit(limit)
      .select('username wins losses draws gamesPlayed lastPlayed');
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
};


const getPlayerStats = async (req, res) => {
  try {
    const { username } = req.params;
    
    const stats = await PlayerStats.findOne({ username })
          .select('username wins losses draws gamesPlayed lastPlayed');

    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player stats'
    });
  }
};

module.exports = {
  getLeaderboard,
  getPlayerStats
};