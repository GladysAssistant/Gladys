const { readdirSync, existsSync, unlinkSync } = require('fs');
const { promisify } = require('util');
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

// The global beforeEach resets the database before each of the ~5300 tests, so
// its cost dominates the test suite runtime. Instead of replaying the 18
// seeders through Sequelize every time (~25ms), we snapshot the freshly seeded
// database once (VACUUM INTO), attach the snapshot, and rebuild every table
// from it with a single native exec of DELETE + INSERT INTO ... SELECT
// statements (~1ms). Foreign keys are turned off around the copy: the restored
// state is a complete consistent snapshot, so integrity holds by construction.
let sqliteResetScript = null;
let sqliteExec = null;
let sqliteAll = null;
let cleanMarkers = null;

// Observability for dbReset.test.js: lets the tests assert that the skip
// branches really skip (an unnecessary reset would produce the same data).
const resetDbStats = { sqliteResets: 0, duckDeletes: 0 };

// Most tests never write to the database, so even the fast snapshot copy is
// wasted work for them. Before copying, we read two cheap freshness markers
// and skip the reset when both are unchanged since the last one:
// - total_changes() counts every row insert/update/delete made through this
//   connection (Sequelize routes all queries through it), including changes
//   later rolled back, so a dirty database can never look clean;
// - PRAGMA data_version increments when the file is modified by any OTHER
//   connection or process (e.g. gateway.restoreBackup shelling out to the
//   sqlite3 CLI), covering writes the first marker cannot see.
const readFreshnessMarkers = async () => {
  // node-sqlite3 all() only runs the first statement of a script: two queries.
  const totalChanges = await sqliteAll('SELECT total_changes() AS tc');
  const dataVersion = await sqliteAll('PRAGMA data_version');
  return JSON.stringify([totalChanges, dataVersion]);
};

const initSnapshotReset = async () => {
  const connection = await db.sequelize.connectionManager.getConnection({ type: 'write' });
  sqliteExec = promisify(connection.exec.bind(connection));
  sqliteAll = promisify(connection.all.bind(connection));

  const snapshotPath = `${db.sequelize.options.storage.replace(/\.db$/, '')}-snapshot.db`;
  if (existsSync(snapshotPath)) {
    unlinkSync(snapshotPath);
  }
  await sqliteExec(`VACUUM INTO '${snapshotPath}'`);
  await sqliteExec(`ATTACH DATABASE '${snapshotPath}' AS seed_snapshot`);

  const tables = await sqliteAll(
    `SELECT name FROM seed_snapshot.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
  );
  sqliteResetScript = [
    'PRAGMA foreign_keys = OFF',
    'BEGIN',
    ...tables.map(({ name }) => `DELETE FROM "${name}"`),
    ...tables.map(({ name }) => `INSERT INTO "${name}" SELECT * FROM seed_snapshot."${name}"`),
    'COMMIT',
    'PRAGMA foreign_keys = ON',
  ].join(';\n');
};

const resetDb = async () => {
  if (!sqliteResetScript) {
    // First reset: build a pristine seeded state with the real seeders (in a
    // single transaction to avoid one journal sync per statement), then
    // snapshot it so every later reset is a fast native copy.
    await db.sequelize.query('BEGIN');
    try {
      const queryInterface = db.sequelize.getQueryInterface();
      await Promise.each(reversedSeed, async (seed) => {
        await seed.down(queryInterface);
      });
      await Promise.each(seeds, async (seed) => {
        await seed.up(queryInterface);
      });
      await db.sequelize.query('COMMIT');
    } catch (e) {
      await db.sequelize.query('ROLLBACK');
      throw e;
    }
    await initSnapshotReset();
    cleanMarkers = await readFreshnessMarkers();
  } else {
    const markers = await readFreshnessMarkers();
    if (markers !== cleanMarkers) {
      resetDbStats.sqliteResets += 1;
      try {
        await sqliteExec(sqliteResetScript);
      } catch (e) {
        // A failed exec can leave an open transaction and foreign keys disabled.
        await sqliteExec('ROLLBACK; PRAGMA foreign_keys = ON').catch(() => {});
        throw e;
      }
      // The reset itself moved the markers: re-read them so the next call
      // compares against the freshly restored state.
      cleanMarkers = await readFreshnessMarkers();
    }
  }
  // Clean DuckDB database (a separate database, not covered by the snapshot).
  // Same idea as above: the table is empty for the vast majority of tests, and
  // counting is much cheaper than deleting. Both queries go through the
  // serialized write queue, so they cannot race a pending write.
  const rows = await db.duckDbWriteConnectionAllAsync('SELECT count(*) AS c FROM t_device_feature_state');
  if (rows.length === 0 || Number(rows[0].c) !== 0) {
    resetDbStats.duckDeletes += 1;
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  }
};

module.exports = {
  seedDb,
  cleanDb,
  resetDb,
  resetDbStats,
};
