const path = require('path');

// This file is loaded first via mocha --require (see package.json "test" scripts).
// It must run before any module that reads getConfig() / models (e.g. bootstrap.test.js).

const DEV_DB = path.resolve(__dirname, '../gladys-development.db');

if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    'Refusing to run tests without NODE_ENV=test. Use "npm test" instead of calling mocha directly without cross-env NODE_ENV=test.',
  );
}

if (!process.env.SQLITE_FILE_PATH) {
  process.env.SQLITE_FILE_PATH = './gladys-test.db';
}

// In --parallel mode every mocha worker is a separate process that boots its
// own Gladys against its own database: derive a per-process path (the DuckDB
// file and the reset snapshot are both derived from this path, so they follow
// automatically). The files are removed when the process exits.
// The main mocha process runs this file first and marks itself: worker
// processes inherit the variable and skip the startup purge below.
const isMainMochaProcess = !process.env.GLADYS_TEST_MAIN_PID;
if (isMainMochaProcess) {
  process.env.GLADYS_TEST_MAIN_PID = String(process.pid);
}

const workerDb = process.env.SQLITE_FILE_PATH.replace(/\.db$/, `-${process.pid}.db`);
process.env.SQLITE_FILE_PATH = workerDb;

// A run killed before its exit handlers (SIGKILL, hard timeout) leaves
// per-pid database files behind; a later run whose worker happens to get the
// same pid would then boot on a stale file with a possibly different schema.
// Purge every leftover of previous runs before this one starts.
if (isMainMochaProcess) {
  const { readdirSync, rmSync } = require('fs');
  const dbDir = path.dirname(path.resolve(workerDb));
  const dbPrefix = path.basename(process.env.SQLITE_FILE_PATH.replace(`-${process.pid}.db`, ''));
  // Only files that carry a pid suffix are ours to purge: a plain
  // `${dbPrefix}.` match would also delete unrelated neighbors of the
  // database (including the log file a caller may be redirecting to).
  const leftoverPattern = new RegExp(`^${dbPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d+[.-]`);
  readdirSync(dbDir).forEach((file) => {
    if (leftoverPattern.test(file) || /^gladys-backups-\d+$/.test(file)) {
      try {
        rmSync(path.join(dbDir, file), { recursive: true, force: true });
      } catch (e) {
        // Best-effort cleanup: never fail the run for a leftover file.
      }
    }
  });
  // Same purge for the per-pid folders under /tmp (only the exact
  // digits-suffixed names this file and the matter tests generate).
  readdirSync('/tmp').forEach((file) => {
    if (/^(gladys|gladysmattertest)-\d+$/.test(file)) {
      try {
        rmSync(path.join('/tmp', file), { recursive: true, force: true });
      } catch (e) {
        // Best-effort cleanup: never fail the run for a leftover folder.
      }
    }
  });
}

// The gateway backup/restore tests write real files into the backups folder,
// and system.init() empties the temp folder at every Gladys boot: give each
// worker its own copy of both (the test config reads BACKUP_FOLDER and
// TEMP_FOLDER, see config/config.js). Mocha workers INHERIT the main
// process's environment, so a plain "set it if unset" would leave every
// worker sharing the main process's folder: remember the root once and
// always re-derive the per-process value from it.
if (!process.env.GLADYS_TEST_BACKUP_FOLDER_ROOT) {
  process.env.GLADYS_TEST_BACKUP_FOLDER_ROOT = process.env.BACKUP_FOLDER || './gladys-backups';
}
process.env.BACKUP_FOLDER = `${process.env.GLADYS_TEST_BACKUP_FOLDER_ROOT}-${process.pid}`;

if (!process.env.GLADYS_TEST_TEMP_FOLDER_ROOT) {
  process.env.GLADYS_TEST_TEMP_FOLDER_ROOT = process.env.TEMP_FOLDER || '/tmp/gladys';
}
process.env.TEMP_FOLDER = `${process.env.GLADYS_TEST_TEMP_FOLDER_ROOT}-${process.pid}`;

process.on('exit', () => {
  const { unlinkSync, readdirSync, rmSync } = require('fs');
  try {
    rmSync(process.env.BACKUP_FOLDER, { recursive: true, force: true });
  } catch (e) {
    // Best-effort cleanup: never fail the run for a leftover folder.
  }
  try {
    rmSync(process.env.TEMP_FOLDER, { recursive: true, force: true });
  } catch (e) {
    // Best-effort cleanup: never fail the run for a leftover folder.
  }
  const dir = path.dirname(path.resolve(workerDb));
  const base = path.basename(workerDb).replace(/\.db$/, '');
  readdirSync(dir).forEach((file) => {
    // Match the pid boundary exactly: pid 12 must not delete pid 123's files
    // (the derived names are base.db, base.duckdb, base-snapshot.db and the
    // SQLite journal variants base.db-wal / base.db-shm).
    if (file.startsWith(`${base}.`) || file.startsWith(`${base}-`)) {
      try {
        unlinkSync(path.join(dir, file));
      } catch (e) {
        // Best-effort cleanup: never fail the run for a leftover file.
      }
    }
  });
});

const resolvedDb = path.resolve(process.env.SQLITE_FILE_PATH);

if (resolvedDb === DEV_DB) {
  throw new Error(
    'Refusing to run tests against gladys-development.db. Unset SQLITE_FILE_PATH or use ./gladys-test.db (npm test sets this automatically).',
  );
}
