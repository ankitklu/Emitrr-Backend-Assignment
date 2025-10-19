## Deployed Url: 
https://ankit-emitrr-backend-assignment-klu.vercel.app/

## Backend Structure
Backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Game.js
│   │   └── PlayerStats.js
│   ├── controllers/
│   │   ├── gameController.js
│   │   └── leaderboardController.js
│   ├── services/
│   │   ├── botService.js
│   │   ├── gameService.js
│   │   └── matchmakingService.js
│   ├── socket/
│   │   ├── socketHandlers.js
│   │   └── socketEvents.js
│   ├── routes/
│   │   └── api.js
│   ├── utils/
│   │   └── gameLogic.js
│   └── app.js
├── server.js
└── package.json

## Backend Structure
Frontend/
├── src/
    ├── App.tsx 


## Overall Data Flow
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                    (React + TypeScript)                     │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
             │ Socket.IO Events               │ REST API
             │                                │
┌────────────▼────────────────────────────────▼───────────────┐
│                        server.js                            │
│                     (Entry Point)                           │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
             │                                │
      ┌──────▼──────┐                  ┌──────▼──────┐
      │   Socket    │                  │   Express   │
      │  Handlers   │                  │     App     │
      └──────┬──────┘                  └──────┬──────┘
             │                                │
             │                                │
      ┌──────▼──────────┐              ┌──────▼──────────┐
      │ Socket Events   │              │     Routes      │
      │   Handlers      │              │   (REST API)    │
      └──────┬──────────┘              └──────┬──────────┘
             │                                │
             │                                │
             │                         ┌──────▼──────────┐
             │                         │  Controllers    │
             │                         │ - Game          │
             │                         │ - Leaderboard   │
             │                         └──────┬──────────┘
             │                                │
             └────────────┬───────────────────┘
                          │
                   ┌──────▼──────────┐
                   │    Services     │
                   │ - Game          │
                   │ - Matchmaking   │
                   │ - Bot AI        │
                   └──────┬──────────┘
                          │
                   ┌──────▼──────────┐
                   │     Utils       │
                   │  - Game Logic   │
                   └──────┬──────────┘
                          │
                   ┌──────▼──────────┐
                   │     Models      │
                   │ - Game          │
                   │ - PlayerStats   │
                   └──────┬──────────┘
                          │
                   ┌──────▼──────────┐
                   │    MongoDB      │
                   │   Database      │
                   └─────────────────┘


# 4 in a Row - Real-Time Multiplayer Game

A real-time Connect Four game featuring competitive bot gameplay, automatic matchmaking, reconnection support, and a persistent leaderboard.

---

## Features

- Real-time multiplayer using **WebSockets (Socket.IO)**
- Automatic matchmaking with a 10-second timeout before a bot joins
- Competitive AI bot using Minimax algorithm with alpha-beta pruning
- Reconnection support allowing 30 seconds to rejoin after disconnection
- Persistent leaderboard using MongoDB
- Game analytics tracking for moves, wins, and durations
- Playable in Player vs Player or Player vs Bot modes

---

## Tech Stack

**Backend:** Node.js, Express, Socket.IO, MongoDB, Mongoose  
**Frontend:** React, TypeScript, Socket.IO Client  
**Database:** MongoDB

---

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or remote)
- npm or yarn

---

### 1. Backend Setup

```bash
# Create backend directory
mkdir backend
cd backend

# Copy backend package.json and server.js files

# Install dependencies
npm install

# Start MongoDB (if running locally)
# Ensure MongoDB is available at mongodb://localhost:27017

# Start the backend server
npm start

# Or for development with auto-reload
npm run dev
```

**Backend runs on:** `http://localhost:3001`

---

### 2. Frontend Setup

```bash
# Create frontend directory (in a new terminal)
cd ..
npx create-react-app frontend --template typescript
cd frontend

# Copy App.tsx and App.css to src/
# Copy frontend package.json

# Install additional dependencies
npm install socket.io-client

# Start the React app
npm start
```

**Frontend runs on:** `http://localhost:3000`

---

### 3. MongoDB Setup

#### Option A: Local MongoDB

```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod
```

On macOS with Homebrew:

```bash
brew services start mongodb-community
```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and get your connection string
3. Update **line 17** in `server.js`:

```javascript
mongoose.connect('YOUR_MONGODB_CONNECTION_STRING', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```

---

## Game Rules

- **Grid:** 7 columns × 6 rows  
- **Objective:** Connect 4 discs vertically, horizontally, or diagonally  
- **Turns:** Players alternate dropping discs into columns  
- **Win:** First player to connect 4 wins  
- **Draw:** Board fills up without a winner  

---

## How to Play

1. **Enter Username:** Type your username and click "Join Game".  
2. **Matchmaking:**
   - If another player is waiting, you will be matched immediately.
   - If no player joins within 10 seconds, a bot will join.
3. **Make Moves:** Click on the top row of a column to drop your disc.
4. **Game Over:** The game ends when a player wins or the board is full.
5. **Play Again:** Click "Play Again" to start a new game.

---

## Bot AI Strategy

The bot uses a **Minimax algorithm with alpha-beta pruning** and evaluates:

- **Immediate Win:** Takes winning move if available  
- **Block Opponent:** Blocks opponent’s winning move  
- **Strategic Planning:**
  - Prefers center column positions  
  - Evaluates potential 4-in-a-row sequences  
  - Calculates up to 4 moves ahead  
  - Creates winning opportunities while defending  

---

## Features Breakdown

### Matchmaking
- Players join a queue
- Automatic pairing with other players
- 10-second timeout triggers bot opponent
- Alternating first-player assignment for fairness

### Reconnection
- Players can reconnect within 30 seconds of disconnection
- Game state is preserved
- Opponent notified of disconnection
- Auto-forfeit after 30 seconds

### Analytics Events
Tracks key events including:
- `game_started`
- `move_made`
- `bot_move`
- `game_ended`

### Leaderboard
- Tracks wins, losses, and draws per player
- Updates in real time
- Displays top 10 players
- Stored persistently in MongoDB

---

## API Endpoints

### **GET** `/api/leaderboard`
Returns the top 10 players by wins.

**Response:**
```json
[
  {
    "username": "player1",
    "wins": 10,
    "losses": 5,
    "draws": 2
  }
]
```

### **GET** `/api/games/:username`
Returns the last 20 games for a specific player.

**Response:**
```json
[
  {
    "gameId": "game_1234567890",
    "player1": "player1",
    "player2": "player2",
    "winner": "player1",
    "isDraw": false,
    "moves": 25,
    "startedAt": "2025-01-15T10:30:00Z",
    "endedAt": "2025-01-15T10:35:00Z"
  }
]
```

---

## Socket.IO Events

### Client → Server
- `joinQueue`: Join matchmaking with username  
- `makeMove`: Make a move (`col`, `gameId`, `username`)

### Server → Client
- `waitingForOpponent`: Waiting for another player  
- `gameStart`: Game starts with initial state  
- `playerNumber`: Assigns player number (1 or 2)  
- `moveMade`: Move made by a player or bot  
- `turnChange`: Turn changes to the next player  
- `gameOver`: Game ended with result  
- `opponentDisconnected`: Opponent left the game  
- `gameRejoined`: Player reconnected to the game  
- `error`: Error message  

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Failed
- Ensure MongoDB is running  
- Verify connection string in `server.js`  
- For Atlas, confirm network access and IP whitelist  

### WebSocket Connection Failed
- Check CORS settings in `server.js`  
- Ensure backend is running on port 3001  
- Update `SOCKET_URL` in `App.tsx` if required  

---

## License

This project is intended for educational and demonstration purposes.
