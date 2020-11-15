const { OAuth2Server } = require('oauth2-mock-server');
const { fake } = require('sinon');
const { assert } = require('chai');
const EventEmitter = require('events');
const ServerMock = require('mock-http-server');

const logger = require('../../../../utils/logger');

const WithingsHandler = require('../../../../services/withings/lib');

const serverOauth2 = new OAuth2Server();

const server = new ServerMock({ host: 'localhost', port: 9192 }, null);

const gladys = {
  variable: {
    getValue: fake.returns(
      '{"access_token":"b96a86b654acb01c2aeb4d5a39f10ff9c964f8e4","expires_in":10800,' +
        '"token_type":"Bearer",' +
        '"scope":"user.info,user.metrics,user.activity,user.sleepevents",' +
        '"refresh_token":"11757dc7fd8d25889f5edfd373d1f525f53d4942",' +
        '"userid":"33669966",' +
        '"expires_at":"2020-11-13T20:46:50.042Z"}',
    ),
    setValue: fake.returns(null),
    destroy: fake.returns(null),
  },
  device: {
    create: fake.returns(null),
    destroyBySelectorPattern: fake.returns(null),
  },
  event: new EventEmitter(),
};

describe('WithingsHandler', () => {
  before(function testBefore(done) {
    server.on({
      method: 'GET',
      path: '/v2/user',
      reply: {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status: 0,
          body: {
            devices: [
              {
                type: 'string',
                model: 'string',
                model_id: 0,
                battery: 'string',
                deviceid: 'string',
                timezone: 'string',
                last_session_date: 0,
              },
            ],
          },
        }),
      },
    });

    server.on({
      method: 'GET',
      path: '/measure',
      reply: {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status: 0,
          body: {
            updatetime: 'string',
            timezone: 'string',
            measuregrps: [
              {
                grpid: 0,
                attrib: 0,
                date: 0,
                created: 0,
                category: 0,
                deviceid: 'string',
                measures: [
                  {
                    value: 0,
                    type: 0,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                ],
                comment: 'string',
              },
            ],
            more: true,
            offset: 0,
          },
        }),
      },
    });

    server.start(done);

    // Start fake oatuh2 server
    // Generate a new RSA key and add it to the keystore
    serverOauth2.issuer.keys.generateRSA();
    // Start the server
    serverOauth2.start(9292, 'localhost');
  });

  after(function testAfter(done) {
    server.stop(done);
    serverOauth2.stop();
  });

  const withingsHandler = new WithingsHandler(
    gladys,
    '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
    'http://localhost:9192',
    'test',
  );

  it('withings serviceId is good', async () => {
    const result = await withingsHandler.getServiceId();
    return assert.equal(result.success, true);
  });

  it('withings setVar must send success = false', async () => {
    const badGladys = {
      variable: {
        getValue: fake.returns(null),
      },
      event: new EventEmitter(),
    };
    const badWithingsHandler = new WithingsHandler(
      badGladys,
      '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
      'http://localhost:9192',
      'test',
    );

    const result = await badWithingsHandler.saveVar('789dsfds452fsdq27fze2ds', 'fdsf847f5re3f92d1', 'test', null);
    return assert.equal(result.success, false);
  });

  it('withings setVar must send success = true', async () => {
    const result = await withingsHandler.saveVar('789dsfds452fsdq27fze2ds', 'fdsf847f5re3f92d1', 'test', null);
    return assert.equal(result.success, true);
  });

  it('withings init is good', async () => {
    const result = await withingsHandler.init('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    logger.debug(result);
    return assert.isNotNull(result);
  });

  it('withings poll is not good', async () => {
    const testDevice = {
      id: 'cfsmb47f-4d25-4381-8923-2633b23192sm',
      name: 'Test withings',
      selector: 'test-withings',
      external_id: 'test-withings-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
    };
    const result = await withingsHandler.poll(testDevice);
    logger.debug(result);
    return assert.isNotNull(result);
  });

  it('withings deleteVar is good', async () => {
    const result = await withingsHandler.deleteVar('req', undefined);
    logger.debug(result);
    return assert.isNotNull(result);
  });

  it('withings deleteDevices is not good', async () => {
    const result = await withingsHandler.deleteDevices();
    logger.debug(result);
    return assert.isNotNull(result);
  });
});
