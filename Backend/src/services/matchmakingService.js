const waitingPlayers = new Map();

const MATCHMAKING_TIMEOUT = 10000;

//addign player to queue
const addToQueue = (username, socketId, timeoutCallback) => {
  const timeout = setTimeout(() => {
    timeoutCallback();
  }, MATCHMAKING_TIMEOUT);
  
  waitingPlayers.set(username, { username, socketId, timeout });
  
  return { username, socketId, timeout };
};

//remove player from queue
const removeFromQueue = (username) => {
  const player = waitingPlayers.get(username);
  if (player) {
    clearTimeout(player.timeout);
    waitingPlayers.delete(username);
  }
  return player;
};

// getting the first waiting player except of the current player
const getWaitingPlayer = (excludeUsername) => {
  for (const [username, player] of waitingPlayers.entries()) {
    if (username !== excludeUsername) {
      return player;
    }
  }
  return null;
};

// is the player inside the queue ?
const isInQueue = (username) => {
  return waitingPlayers.has(username);
};


const getQueueSize = () => {
  return waitingPlayers.size;
};

// clearing all of th4e waiting players
const clearQueue = () => {
  for (const player of waitingPlayers.values()) {
    clearTimeout(player.timeout);
  }
  waitingPlayers.clear();
};

// get all waiting players
const getAllWaitingPlayers = () => {
  return Array.from(waitingPlayers.values());
};

module.exports = {
  addToQueue,
  removeFromQueue,
  getWaitingPlayer,
  isInQueue,
  getQueueSize,
  clearQueue,
  getAllWaitingPlayers,
  MATCHMAKING_TIMEOUT
};