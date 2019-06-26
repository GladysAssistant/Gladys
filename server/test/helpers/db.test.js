const { readdirSync } = require('fs');
const Promise = require('bluebird');
const { join } = require('path');
const db = require('../../models');

const SEEDERS_PATH = join(__filename, '../../../seeders');

const files = readdirSync(SEEDERS_PATH);
const seeds = files.map((file) => require(join(SEEDERS_PATH, file))); // eslint-disable-line
const reversedSeed = seeds.slice().reverse();

const callLater = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 10);
  });

module.exports.seedDb = async () => {
  await Promise.mapSeries(seeds, (seed) => callLater().then(() => seed.up(db.sequelize.getQueryInterface())));
};

module.exports.cleanDb = async () => {
  await Promise.mapSeries(reversedSeed, (seed) => callLater().then(() => seed.down(db.sequelize.getQueryInterface())));
};
