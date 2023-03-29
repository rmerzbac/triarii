const knex = require('knex')(require('./knexfile'));
const { v4: uuidv4 } = require('uuid');

async function setupDb() {
  await knex.schema.createTable('games', (table) => {
    table.string('id').primary();
    table.text('boardCode');
    table.text('selected');
  });

  console.log('Database setup complete');
  process.exit();
}

setupDb();
