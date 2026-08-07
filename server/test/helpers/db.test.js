const { readdirSync } = require('fs');
const Promise = require('bluebird');
const { join } = require('path');
const db = require('../../models');

const SEEDERS_PATH = join(__filename, '../../../seeders');

const files = readdirSync(SEEDERS_PATH);
const seeds = files.map((file) => require(join(SEEDERS_PATH, file))); // eslint-disable-line
const reversedSeed = seeds.slice().reverse();

const seedDb = async () => {
  const queryInterface = db.sequelize.getQueryInterface();
  await Promise.each(seeds, async (seed) => {
    await seed.up(queryInterface);
  });
};

const cleanDb = async () => {
  // Clean SQLite database
  const queryInterface = db.sequelize.getQueryInterface();
  await Promise.each(reversedSeed, async (seed) => {
    await seed.down(queryInterface);
  });
  // Clean DuckDB database
  await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
};

// Wrapping the whole clean + seed cycle in a single SQLite transaction turns
// the ~36 auto-committed seeder statements (each paying a journal sync) into
// one commit, which makes the per-test database reset 2-3x faster. The DuckDB
// DELETE inside cleanDb targets a separate database and is not affected by
// the SQLite transaction.
const resetDb = async () => {
  await db.sequelize.query('BEGIN');
  try {
    await cleanDb();
    await seedDb();
    await db.sequelize.query('COMMIT');
  } catch (e) {
    await db.sequelize.query('ROLLBACK');
    throw e;
  }
};

module.exports = {
  seedDb,
  cleanDb,
  resetDb,
};
