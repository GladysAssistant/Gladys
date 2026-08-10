// nock patches the core http/https modules the moment it is required. Load it
// before anything else so every axios copy (each service embeds its own, and
// follow-redirects captures http.request at load time) sees the patched
// module: in --parallel mode each worker loads files in its own order, and a
// service axios loaded before nock would bypass the interceptors.
require('nock');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const server = require('../api');
const Gladys = require('../lib');
const db = require('../models');
const logger = require('../utils/logger');
const { seedDb, cleanDb, resetDb } = require('./helpers/db.test');
const { resetSharedMockHistories } = require('./helpers/sharedMockSandboxes');
const fakeOpenWeatherService = require('./services/openweather/fakeOpenWeatherService');

chai.use(chaiAsPromised);

process.env.JWT_SECRET = 'secret';

// This file replaces the old test/bootstrap.test.js. It is a mocha "root hook
// plugin" (loaded through --require, see package.json): unlike hooks declared
// inside a test file, root hook plugin hooks also apply in --parallel mode,
// where every worker process must boot its own Gladys instance against its
// own database (see setup-env.js for the per-process database path).
//
// In parallel mode mocha runs the beforeAll hook once per test FILE, and
// worker processes are reused for many files: the boot is memoized so each
// worker only pays it once.
let bootPromise = null;

const boot = async () => {
  const config = {
    disableService: true,
    disableBrainLoading: false,
    disableSchedulerLoading: true,
    disableDuckDbMigration: true,
    disableGladysUpgradedCheck: true,
    jwtSecret: 'secret',
  };
  const gladys = Gladys(config);
  try {
    await cleanDb();
  } catch (e) {
    logger.trace('Impossible to clean database, ignoring error');
  }
  try {
    await db.umzug.up();
    await seedDb();
  } catch (e) {
    logger.trace(e);
    throw e;
  }
  await gladys.start();
  gladys.stateManager.setState('service', 'openweather', fakeOpenWeatherService);
  gladys.gateway.gladysGatewayClient.accessToken = 'access-token';
  gladys.gateway.gladysGatewayClient.refreshToken = 'refresh-token';
  // Port 0 lets the OS pick a free port: several workers listen concurrently,
  // and no test depends on the actual port (supertest wraps the app object).
  // @ts-ignore
  global.TEST_BACKEND_APP = server.start(gladys, 0, {
    serveFront: false,
  }).app;
  // @ts-ignore
  global.TEST_GLADYS_INSTANCE = gladys;
};

exports.mochaHooks = {
  beforeAll: async function beforeAll() {
    this.timeout(30000);
    if (!bootPromise) {
      bootPromise = boot();
    }
    await bootPromise;
  },
  // cleaning and filling database between each tests
  beforeEach: async function beforeEach() {
    this.timeout(16000);
    try {
      await resetDb();
      resetSharedMockHistories();
      // @ts-ignore
      global.TEST_GLADYS_INSTANCE.cache.clear();
    } catch (e) {
      logger.trace(e);
      throw e;
    }
  },
};
