const { expect } = require('chai');
const { promisify } = require('util');
const sqlite3 = require('sqlite3');
const db = require('../../models');
const { resetDb, resetDbStats } = require('./db.test');

// Direct tests of the freshness detection in resetDb (see db.test.js): a clean
// database must be left intact by the skip path, and every kind of write —
// through Sequelize, through a foreign connection, or into DuckDB — must be
// detected and rolled back to the seeded state. The resetDbStats counters
// prove which branch ran: a skipped reset and an unnecessary one would
// otherwise produce the same data.
describe('resetDb freshness detection', () => {
  it('should skip both resets and keep the seeded rows when nothing was written', async () => {
    const before = await db.House.count();
    expect(before).to.be.above(0);
    const stats = { ...resetDbStats };
    // The global beforeEach just reset the database, so this call must take
    // the "markers unchanged" branch and leave the data as-is.
    await resetDb();
    expect(resetDbStats.sqliteResets).to.equal(stats.sqliteResets);
    expect(resetDbStats.duckDeletes).to.equal(stats.duckDeletes);
    expect(await db.House.count()).to.equal(before);
  });

  it('should restore rows modified through the Sequelize connection', async () => {
    const [house] = await db.House.findAll();
    await db.sequelize.query(`UPDATE t_house SET name = 'dirty' WHERE id = '${house.id}'`);
    expect((await db.House.findByPk(house.id)).name).to.equal('dirty');
    const stats = { ...resetDbStats };
    // total_changes() moved: the reset must detect it and restore the seed.
    await resetDb();
    expect(resetDbStats.sqliteResets).to.equal(stats.sqliteResets + 1);
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
    try {
      await promisify(external.run.bind(external))(`UPDATE t_house SET name = 'dirty' WHERE id = '${house.id}'`);
    } finally {
      await promisify(external.close.bind(external))();
    }
    expect((await db.House.findByPk(house.id)).name).to.equal('dirty');
    const stats = { ...resetDbStats };
    await resetDb();
    expect(resetDbStats.sqliteResets).to.equal(stats.sqliteResets + 1);
    const restored = await db.House.findByPk(house.id);
    expect(restored.name).to.equal(house.name);
  });

  it('should clear DuckDB states when rows are present', async () => {
    await db.duckDbWriteConnectionAllAsync(
      `INSERT INTO t_device_feature_state VALUES ('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', 12, '2024-01-01 00:00:00')`,
    );
    const inserted = await db.duckDbWriteConnectionAllAsync('SELECT count(*) AS c FROM t_device_feature_state');
    expect(Number(inserted[0].c)).to.equal(1);
    const stats = { ...resetDbStats };
    await resetDb();
    expect(resetDbStats.duckDeletes).to.equal(stats.duckDeletes + 1);
    const after = await db.duckDbWriteConnectionAllAsync('SELECT count(*) AS c FROM t_device_feature_state');
    expect(Number(after[0].c)).to.equal(0);
  });
});
