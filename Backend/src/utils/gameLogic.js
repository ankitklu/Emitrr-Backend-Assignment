const ROWS = 6;
const COLS = 7;

//create an empty game board...
const createBoard = () => {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
};

// validating the move if it.s valid or not!!
const isValidMove = (board, col) => {
  return col >= 0 && col < COLS && board[0][col] === 0;
};

// making th emove on the board
const makeMove = (board, col, player) => {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === 0) {
      board[row][col] = player;
      return row;
    }
  }
  return -1;
};

//win move played is checked here

const checkWin = (board, row, col, player) => {
  // Horizontal check
  for (let c = 0; c < COLS - 3; c++) {
    if (board[row][c] === player &&
        board[row][c + 1] === player &&
        board[row][c + 2] === player &&
        board[row][c + 3] === player) {
      return true;
    }
  }

  // Vertical check
  for (let r = 0; r < ROWS - 3; r++) {
    if (board[r][col] === player &&
        board[r + 1][col] === player &&
        board[r + 2][col] === player &&
        board[r + 3][col] === player) {
      return true;
    }
  }

  // Diagonal checks (down-right)
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] === player &&
          board[r + 1][c + 1] === player &&
          board[r + 2][c + 2] === player &&
          board[r + 3][c + 3] === player) {
        return true;
      }
    }
  }

  // Diagonal checks (up-right)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] === player &&
          board[r - 1][c + 1] === player &&
          board[r - 2][c + 2] === player &&
          board[r - 3][c + 3] === player) {
        return true;
      }
    }
  }

  return false;
};

// what if the board is full
const isBoardFull = (board) => {
  return board[0].every(cell => cell !== 0);
};

// on each move we check if there is a winning move available
const hasWinningMove = (board, player) => {
  for (let col = 0; col < COLS; col++) {
    if (isValidMove(board, col)) {
      const tempBoard = board.map(row => [...row]);
      const row = makeMove(tempBoard, col, player);
      if (row !== -1 && checkWin(tempBoard, row, col, player)) {
        return col;
      }
    }
  }
  return -1;
};

module.exports = {
  ROWS,
  COLS,
  createBoard,
  isValidMove,
  makeMove,
  checkWin,
  isBoardFull,
  hasWinningMove
};