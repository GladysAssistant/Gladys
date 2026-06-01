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

const resolvedDb = path.resolve(process.env.SQLITE_FILE_PATH);

if (resolvedDb === DEV_DB) {
  throw new Error(
    'Refusing to run tests against gladys-development.db. Unset SQLITE_FILE_PATH or use ./gladys-test.db (npm test sets this automatically).',
  );
}
