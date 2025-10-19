import { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import './App.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const API_URL = import.meta.env.VITE_API_URL || SOCKET_URL;

interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  draws: number;
}

interface GameState {
  gameId: string;
  player1: string;
  player2: string;
  board: number[][];
  currentTurn: number;
  playerNumber: number;
  gameOver: boolean;
  winner: string | null;
  isDraw: boolean;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [isInQueue, setIsInQueue] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('waitingForOpponent', () => {
      let countdown = 10;
      setMessage(`Waiting for opponent... (Bot will join in ${countdown} seconds if no player found)`);
      const interval = setInterval(() => {
        countdown--;
        setMessage(`Waiting for opponent... (Bot will join in ${countdown} seconds if no player found)`);
        if (countdown <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    });

    newSocket.on('gameStart', (data: any) => {
      setMessage('');
      setIsInQueue(false);
      setGameState({
        gameId: data.gameId,
        player1: data.player1,
        player2: data.player2,
        board: data.board,
        currentTurn: data.currentTurn,
        playerNumber: 0,
        gameOver: false,
        winner: null,
        isDraw: false
      });
    });

    newSocket.on('playerNumber', (data: { playerNumber: number }) => {
      setGameState(prev => prev ? { ...prev, playerNumber: data.playerNumber } : null);
    });

    newSocket.on('gameRejoined', (data: any) => {
      setMessage('');
      setIsInQueue(false);
      setGameState({
        gameId: data.gameId,
        player1: data.player1,
        player2: data.player2,
        board: data.board,
        currentTurn: data.currentTurn,
        playerNumber: data.playerNumber,
        gameOver: false,
        winner: null,
        isDraw: false
      });
    });

    newSocket.on('moveMade', (data: any) => {
      setGameState(prev => prev ? { ...prev, board: data.board } : null);
    });

    newSocket.on('turnChange', (data: { currentTurn: number }) => {
      setGameState(prev => prev ? { ...prev, currentTurn: data.currentTurn } : null);
    });

    newSocket.on('gameOver', (data: any) => {
      setGameState(prev => prev ? {
        ...prev,
        gameOver: true,
        winner: data.winner,
        isDraw: data.isDraw,
        board: data.board
      } : null);
      fetchLeaderboard();
    });

    newSocket.on('opponentDisconnected', (data: { message: string }) => {
      setMessage(data.message);
    });

    newSocket.on('error', (data: { message: string }) => {
      setMessage(`Error: ${data.message}`);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const url = `${API_URL}/api/leaderboard`;
      console.log('Fetching leaderboard from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();

      // Backend returns { success: true, data: [...] }
      if (json && typeof json === 'object') {
        if (Array.isArray(json.data)) {
          setLeaderboard(json.data);
          return;
        }

        // Sometimes the endpoint might return the array directly
        if (Array.isArray(json)) {
          setLeaderboard(json);
          return;
        }

        console.warn('Unexpected leaderboard response shape:', json);
      }

      // Fallback to empty array
      setLeaderboard([]);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const joinQueue = () => {
    if (!username.trim()) {
      setMessage('Please enter a username');
      return;
    }
    if (socket) {
      socket.emit('joinQueue', { username: username.trim() });
      setIsInQueue(true);
    }
  };

  const makeMove = (col: number) => {
    if (!gameState || gameState.gameOver) return;
    if (gameState.currentTurn !== gameState.playerNumber) {
      setMessage('Not your turn!');
      return;
    }
    if (socket) {
      socket.emit('makeMove', {
        gameId: gameState.gameId,
        col,
        username
      });
      setMessage('');
    }
  };

  const resetGame = () => {
    setGameState(null);
    setIsInQueue(false);
    setMessage('');
  };

  const renderBoard = () => {
    if (!gameState) return null;

    return (
      <div className="board">
        {gameState.board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={`cell ${cell === 1 ? 'player1' : cell === 2 ? 'player2' : ''}`}
                onClick={() => !gameState.gameOver && rowIndex === 0 && makeMove(colIndex)}
                style={{ cursor: rowIndex === 0 && !gameState.gameOver ? 'pointer' : 'default' }}
              >
                {cell !== 0 && <div className="disc" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderGameInfo = () => {
    if (!gameState) return null;

    let statusMessage = '';
    if (gameState.gameOver) {
      if (gameState.isDraw) {
        statusMessage = "Game Over - It's a Draw!";
      } else if (gameState.winner === username) {
        statusMessage = 'You Win! 🎉';
      } else {
        statusMessage = `Game Over - ${gameState.winner} Wins!`;
      }
    } else {
      const isYourTurn = gameState.currentTurn === gameState.playerNumber;
      statusMessage = isYourTurn ? 'Your Turn' : `${gameState.currentTurn === 1 ? gameState.player1 : gameState.player2}'s Turn`;
    }

    return (
      <div className="game-info">
        <h2>{statusMessage}</h2>
        <div className="players">
          <div className={`player-info ${gameState.playerNumber === 1 ? 'you' : ''}`}>
            <div className="player-disc player1"></div>
            <span>{gameState.player1} {gameState.playerNumber === 1 && '(You)'}</span>
          </div>
          <div className={`player-info ${gameState.playerNumber === 2 ? 'you' : ''}`}>
            <div className="player-disc player2"></div>
            <span>{gameState.player2} {gameState.playerNumber === 2 && '(You)'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <h1>4 in a Row - Connect Four</h1>

      {!gameState && !isInQueue && (
        <div className="menu">
          <div className="login-section">
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && joinQueue()}
            />
            <button onClick={joinQueue}>Join Game</button>
          </div>
          <button onClick={() => setShowLeaderboard(!showLeaderboard)}>
            {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
          </button>
        </div>
      )}

      {message && <div className="message">{message}</div>}

      {gameState && (
        <div className="game-container">
          {renderGameInfo()}
          {renderBoard()}
          {gameState.gameOver && (
            <button className="new-game-btn" onClick={resetGame}>
              Play Again
            </button>
          )}
        </div>
      )}

      {showLeaderboard && (
        <div className="leaderboard">
          <h2>Leaderboard</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Draws</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={entry.username}>
                  <td>{index + 1}</td>
                  <td>{entry.username}</td>
                  <td>{entry.wins}</td>
                  <td>{entry.losses}</td>
                  <td>{entry.draws}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5}>No players yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;