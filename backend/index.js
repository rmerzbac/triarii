const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;
const knex = require('knex')(require('./knexfile'));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Triarii backend is running!');
});


const { v4: uuidv4 } = require('uuid');

// Create a new game
app.post('/game', async (req, res) => {
  const { boardCode } = req.body;
  const id = uuidv4();

  try {
    await knex('games').insert({ id, boardCode, selected });
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating a new game' });
  }
});


// Update a game state
app.put('/game/:id', async (req, res) => {
  const { id } = req.params;
  const { boardCode } = req.body;

  try {
    await knex('games').where('id', id).update({ boardCode });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Error updating the game state' });
  }
});

// Get a game state
app.get('/game/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const game = await knex('games').where('id', id).first();

    if (game) {
      res.status(200).json({ boardCode: game.boardCode });
    } else {
      res.status(404).json({ error: 'Game not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving the game state' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
