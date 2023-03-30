const knex = require('knex')(require('./knexfile'));

async function setupDb() {
  try {
    await knex.schema.createTable('games', (table) => {
      table.string('id').primary();
      table.uuid('whitePlayer');
      table.uuid('blackPlayer');
    });

    await knex.schema.createTable('game_states', (table) => {
      table.increments('id').primary();
      table.string('game_id');
      table.text('boardCode');
      table.text('selected');
      table.foreign('game_id').references('games.id');
    });

    console.log('Database setup complete');
  } catch (error) {
    console.error('Error setting up the database:', error);
  } finally {
    process.exit();
  }
}

setupDb(); // Make sure to call the function here
