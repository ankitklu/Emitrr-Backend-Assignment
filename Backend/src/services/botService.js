const { ROWS, COLS, isValidMove, makeMove, checkWin } = require('../utils/gameLogic');

class BotAI {
  constructor(playerNum) {
    this.playerNum = playerNum;
    this.opponentNum = playerNum === 1 ? 2 : 1;
  }

  //best move for the bot
  getBestMove(board) {

    // checking for thee immediate winning move
    for (let col = 0; col < COLS; col++) {
      if (isValidMove(board, col)) {
        const newBoard = this.copyBoard(board);
        const row = makeMove(newBoard, col, this.playerNum);
        if (checkWin(newBoard, row, col, this.playerNum)) {
          return col;
        }
      }
    }

    // Second, block opponent's winning move
    for (let col = 0; col < COLS; col++) {
      if (isValidMove(board, col)) {
        const newBoard = this.copyBoard(board);
        const row = makeMove(newBoard, col, this.opponentNum);
        if (checkWin(newBoard, row, col, this.opponentNum)) {
          return col;
        }
      }
    }

    // Use minimax for strategic move
    let bestScore = -Infinity;
    let bestCol = 3;

    for (let col = 0; col < COLS; col++) {
      if (isValidMove(board, col)) {
        const newBoard = this.copyBoard(board);
        makeMove(newBoard, col, this.playerNum);
        const score = this.minimax(newBoard, 4, -Infinity, Infinity, false);
        
        if (score > bestScore) {
          bestScore = score;
          bestCol = col;
        }
      }
    }

    return bestCol;
  }

  
   // Minimax algorithm with alpha-beta pruning
   
  minimax(board, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || this.isGameOver(board)) {
      return this.evaluateBoard(board);
    }

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let col = 0; col < COLS; col++) {
        if (isValidMove(board, col)) {
          const newBoard = this.copyBoard(board);
          makeMove(newBoard, col, this.playerNum);
          const score = this.minimax(newBoard, depth - 1, alpha, beta, false);
          maxScore = Math.max(maxScore, score);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) break;
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let col = 0; col < COLS; col++) {
        if (isValidMove(board, col)) {
          const newBoard = this.copyBoard(board);
          makeMove(newBoard, col, this.opponentNum);
          const score = this.minimax(newBoard, depth - 1, alpha, beta, true);
          minScore = Math.min(minScore, score);
          beta = Math.min(beta, score);
          if (beta <= alpha) break;
        }
      }
      return minScore;
    }
  }

 // evaluating the board state
  evaluateBoard(board) {
    // Check for wins
    if (this.checkBoardWin(board, this.playerNum)) return 1000;
    if (this.checkBoardWin(board, this.opponentNum)) return -1000;

    let score = 0;
    
    // Evaluate center column preference
    for (let row = 0; row < ROWS; row++) {
      if (board[row][3] === this.playerNum) score += 3;
      if (board[row][3] === this.opponentNum) score -= 3;
    }

    // Evaluate potential winning sequences
    score += this.evaluateSequences(board, this.playerNum) * 10;
    score -= this.evaluateSequences(board, this.opponentNum) * 10;

    return score;
  }

  
   // Evaluate potential winning sequences
   
  evaluateSequences(board, player) {
    let score = 0;
    
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        // Horizontal
        if (col <= COLS - 4) {
          score += this.scoreWindow([
            board[row][col],
            board[row][col + 1],
            board[row][col + 2],
            board[row][col + 3]
          ], player);
        }
        // Vertical
        if (row <= ROWS - 4) {
          score += this.scoreWindow([
            board[row][col],
            board[row + 1][col],
            board[row + 2][col],
            board[row + 3][col]
          ], player);
        }
        // Diagonal (down-right)
        if (row <= ROWS - 4 && col <= COLS - 4) {
          score += this.scoreWindow([
            board[row][col],
            board[row + 1][col + 1],
            board[row + 2][col + 2],
            board[row + 3][col + 3]
          ], player);
        }
        // Diagonal (up-right)
        if (row >= 3 && col <= COLS - 4) {
          score += this.scoreWindow([
            board[row][col],
            board[row - 1][col + 1],
            board[row - 2][col + 2],
            board[row - 3][col + 3]
          ], player);
        }
      }
    }
    
    return score;
  }

  /**
   * Score a window of 4 cells
   */
  scoreWindow(window, player) {
    let score = 0;
    const playerCount = window.filter(cell => cell === player).length;
    const emptyCount = window.filter(cell => cell === 0).length;
    const opponentCount = window.filter(cell => cell !== player && cell !== 0).length;

    if (playerCount === 3 && emptyCount === 1) score += 5;
    else if (playerCount === 2 && emptyCount === 2) score += 2;
    
    if (opponentCount === 3 && emptyCount === 1) score -= 4;

    return score;
  }

  // checking if the board has a winner
  checkBoardWin(board, player) {
    // Horizontal
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        if (board[row][col] === player &&
            board[row][col + 1] === player &&
            board[row][col + 2] === player &&
            board[row][col + 3] === player) {
          return true;
        }
      }
    }

    // Vertical
    for (let row = 0; row < ROWS - 3; row++) {
      for (let col = 0; col < COLS; col++) {
        if (board[row][col] === player &&
            board[row + 1][col] === player &&
            board[row + 2][col] === player &&
            board[row + 3][col] === player) {
          return true;
        }
      }
    }

    // Diagonal (down-right)
    for (let row = 0; row < ROWS - 3; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        if (board[row][col] === player &&
            board[row + 1][col + 1] === player &&
            board[row + 2][col + 2] === player &&
            board[row + 3][col + 3] === player) {
          return true;
        }
      }
    }

    // Diagonal (up-right)
    for (let row = 3; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        if (board[row][col] === player &&
            board[row - 1][col + 1] === player &&
            board[row - 2][col + 2] === player &&
            board[row - 3][col + 3] === player) {
          return true;
        }
      }
    }

    return false;
  }

  // game over conditionss. 
  isGameOver(board) {
    if (this.checkBoardWin(board, this.playerNum) || this.checkBoardWin(board, this.opponentNum)) {
      return true;
    }
    
    // Check if board is full
    for (let col = 0; col < COLS; col++) {
      if (board[0][col] === 0) return false;
    }
    
    return true;
  }

    // copy the board to simulate moves
  copyBoard(board) {
    return board.map(row => [...row]);
  }
}

module.exports = BotAI;