require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
const PORT = process.env.PORT || 8080;
const knex = require('knex')(require('./knexfile'));

const jwt = require('jsonwebtoken');
const jwtSecret = process.env.SESSION_SECRET;

const { v4: uuidv4 } = require('uuid');

app.use(express.json());

function isAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ error: 'User not authenticated.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({ error: 'User not authenticated.' });
  }
}

app.get('/', (req, res) => {
  res.send('Triarii backend is running!');
});

app.post('/join', async (req, res) => {

  const gameId = req.body.gameId;
  const token = req.body.token;

  if (!gameId) {
    return res.status(400).send({ error: 'Missing game ID.' });
  }

  const game = await knex('games').where('id', gameId).first();

  if (!game) {
    return res.status(404).send({ error: 'Game not found.' });
  }

  let playerColor;
  let userId;

  console.log("Reached");

  if (token) {
    try {
      console.log("Decoding");
      const decoded = jwt.verify(token, jwtSecret);
      userId = decoded.userId;

      console.log("Decoded" + decoded);

      if (game.whitePlayer === userId) {
        playerColor = 'white';
      } else if (game.blackPlayer === userId) {
        playerColor = 'black';
      } else {
        return res.status(403).send({ error: 'User is not part of the game.' });
      }
      res.status(200).json({ token, playerColor, userId });
    } catch (err) {
      return res.status(401).send({ error: 'Invalid token.' });
    }
  } else {
    userId = uuidv4(); // Generate a new UUID for the user
    console.log("uuid: " + userId);

    if (game.whitePlayer && game.blackPlayer) {
      return res.status(403).json("Game full.");
    }

    playerColor = game.whitePlayer ? 'black' : 'white';
    const newToken = jwt.sign({ gameId, playerColor, userId }, jwtSecret);
    const updateData = playerColor === 'white' ? { whitePlayer: userId } : { blackPlayer: userId };
    await knex('games').where('id', gameId).update(updateData);

    res.status(200).json({ token: newToken, playerColor, userId });
  }
});

// Create a new game
app.post('/game', async (req, res) => {
  const { boardCode, selected } = req.body;
  const id = uuidv4();

  try {
    // Insert a new game into the 'games' table
    await knex('games').insert({ id });

    // Insert the initial game state into the 'game_states' table
    await knex('game_states').insert({ game_id: id, boardCode, selected });

    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating a new game' });
  }
});

// Update a game state
app.put('/game/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { boardCode, selected } = req.body;

  try {
    await knex('game_states').insert({ game_id: id, boardCode, selected });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Error updating the game state' });
  }
});

// Get all game states
app.get('/game/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const game = await knex('games').where('id', id).first();

    if (game) {
      // Get all game states from the 'game_states' table, ordered from most recent to least recent
      const gameStates = await knex('game_states')
        .where('game_id', id)
        .orderBy('id', 'desc')
        .select('boardCode', 'selected');

      res.status(200).json(gameStates);
    } else {
      res.status(404).json({ error: 'Game not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving the game states' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
