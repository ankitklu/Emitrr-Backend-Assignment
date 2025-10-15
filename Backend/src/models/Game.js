const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  player1: {
    type: String,
    required: true
  },
  player2: {
    type: String,
    required: true
  },
  winner: {
    type: String,
    default: null
  },
  isDraw: {
    type: Boolean,
    default: false
  },
  moves: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  board: {
    type: [[Number]],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);