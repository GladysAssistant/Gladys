const { expect } = require('chai');
const { promisify } = require('util');
const sqlite3 = require('sqlite3');
const db = require('../../models');
const { resetDb } = require('./db.test');

// Direct tests of the freshness detection in resetDb (see db.test.js): a clean
// database must be left intact by the skip path, and every kind of write —
// through Sequelize, through a foreign connection, or into DuckDB — must be
// detected and rolled back to the seeded state.
describe('resetDb freshness detection', () => {
  it('should keep the seeded rows intact when nothing was written (skip path)', async () => {
    const before = await db.House.count();
    expect(before).to.be.above(0);
    // The global beforeEach just reset the database, so this call must take
    // the "markers unchanged" branch and leave the data as-is.
    await resetDb();
    expect(await db.House.count()).to.equal(before);
  });

  it('should restore rows modified through the Sequelize connection', async () => {
    const [house] = await db.House.findAll();
    await db.sequelize.query(`UPDATE t_house SET name = 'dirty' WHERE id = '${house.id}'`);
    expect((await db.House.findByPk(house.id)).name).to.equal('dirty');
    // total_changes() moved: the reset must detect it and restore the seed.
    await resetDb();
    const restored = await db.House.findByPk(house.id);
    expect(restored.name).to.equal(house.name);
  });

  it('should restore rows modified by another connection (data_version marker)', async () => {
    const [house] = await db.House.findAll();
    // Write through a second, independent SQLite connection: invisible to
    // total_changes() on the Sequelize connection, but PRAGMA data_version
    // must catch it — this mirrors gateway.restoreBackup calling the sqlite3
    // CLI on the database file.
    const external = new sqlite3.Database(db.sequelize.options.storage);
    await promisify(external.run.bind(external))(`UPDATE t_house SET name = 'dirty' WHERE id = '${house.id}'`);
    await promisify(external.close.bind(external))();
    expect((await db.House.findByPk(house.id)).name).to.equal('dirty');
    await resetDb();
    const restored = await db.House.findByPk(house.id);
    expect(restored.name).to.equal(house.name);
  });

  it('should clear DuckDB states when rows are present', async () => {
    await db.duckDbWriteConnectionAllAsync(
      `INSERT INTO t_device_feature_state VALUES ('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', 12, '2024-01-01 00:00:00')`,
    );
    const inserted = await db.duckDbWriteConnectionAllAsync('SELECT count(*) AS c FROM t_device_feature_state');
    expect(Number(inserted[0].c)).to.equal(1);
    await resetDb();
    const after = await db.duckDbWriteConnectionAllAsync('SELECT count(*) AS c FROM t_device_feature_state');
    expect(Number(after[0].c)).to.equal(0);
  });
});
