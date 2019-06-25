const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const server = require('../api/');
const Gladys = require('../lib');
const logger = require('../utils/logger');
const { seedDb, cleanDb } = require('./helpers/db.test');
const fakeDarkSkyService = require('./services/darksky/fakeDarkSkyService');

chai.use(chaiAsPromised);

const SERVER_PORT = 6500;

process.env.JWT_SECRET = 'secret';

before(async function before() {
  this.timeout(8000);
  const config = {
    disableService: true,
    disableBrainLoading: true,
    disableTriggerLoading: true,
    disableSchedulerLoading: true,
    jwtSecret: 'secret',
  };
  const gladys = Gladys(config);
  try {
    await cleanDb();
    await seedDb();
  } catch (e) {
    logger.trace(e);
    throw e;
  }
  await gladys.start();
  gladys.stateManager.setState('service', 'darksky', fakeDarkSkyService);
  gladys.gateway.gladysGatewayClient.accessToken = 'access-token';
  gladys.gateway.gladysGatewayClient.refreshToken = 'refresh-token';
  // @ts-ignore
  global.TEST_BACKEND_APP = server.start(gladys, SERVER_PORT, {
    serveFront: false,
  });
  // @ts-ignore
  global.TEST_GLADYS_INSTANCE = gladys;
});

// cleaning and filling database between each tests
beforeEach(async function beforeEach() {
  this.timeout(8000);
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
