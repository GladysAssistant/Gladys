const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const server = require('../api');
const Gladys = require('../lib');
const db = require('../models');
const logger = require('../utils/logger');
const { seedDb, cleanDb } = require('./helpers/db.test');
const fakeOpenWeatherService = require('./services/openweather/fakeOpenWeatherService');

chai.use(chaiAsPromised);

const SERVER_PORT = 6500;

process.env.JWT_SECRET = 'secret';

before(async function before() {
  this.timeout(16000);
  const config = {
    disableService: true,
    disableBrainLoading: true,
    disableSchedulerLoading: true,
    disableDeviceStateAggregation: true,
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
  // @ts-ignore
  global.TEST_BACKEND_APP = server.start(gladys, SERVER_PORT, {
    serveFront: false,
  }).app;
  // @ts-ignore
  global.TEST_GLADYS_INSTANCE = gladys;
});

// cleaning and filling database between each tests
beforeEach(async function beforeEach() {
  this.timeout(16000);
  try {
    await cleanDb();
    await seedDb();
    // @ts-ignore
    global.TEST_GLADYS_INSTANCE.cache.clear();
  } catch (e) {
    logger.trace(e);
    throw e;
  }
});
