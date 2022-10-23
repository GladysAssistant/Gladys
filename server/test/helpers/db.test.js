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
  const queryInterface = db.sequelize.getQueryInterface();
  await Promise.each(reversedSeed, async (seed) => {
    await seed.down(queryInterface);
  });
};

module.exports = {
  seedDb,
  cleanDb,
};
