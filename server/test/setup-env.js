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
const workerDb = process.env.SQLITE_FILE_PATH.replace(/\.db$/, `-${process.pid}.db`);
process.env.SQLITE_FILE_PATH = workerDb;

process.on('exit', () => {
  // eslint-disable-next-line global-require
  const { unlinkSync, readdirSync } = require('fs');
  const dir = path.dirname(path.resolve(workerDb));
  const base = path.basename(workerDb).replace(/\.db$/, '');
  readdirSync(dir).forEach((file) => {
    if (file.startsWith(base)) {
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
