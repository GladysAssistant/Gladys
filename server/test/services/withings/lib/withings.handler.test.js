const { OAuth2Server } = require('oauth2-mock-server');
const { fake } = require('sinon');
const { assert } = require('chai');
const uuid = require('uuid');
const EventEmitter = require('events');
const ServerMock = require('mock-http-server');

// const logger = require('../../../../utils/logger');

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
  user: {
    get: fake.returns([{ id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' }]),
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
                battery: 'low',
                deviceid: 'withingsDevideId',
                timezone: 'string',
                last_session_date: 0,
              },
              {
                type: 'string',
                model: 'string',
                model_id: 0,
                battery: 'no',
                deviceid: 'withingsDevideId2',
                timezone: 'string',
                last_session_date: 0,
              },
              {
                type: 'string',
                model: 'string',
                model_id: 0,
                battery: 'medium',
                deviceid: 'withingsDevideId3',
                timezone: 'string',
                last_session_date: 0,
              },
              {
                type: 'string',
                model: 'string',
                model_id: 0,
                battery: 'high',
                deviceid: 'withingsDevideId4',
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
                category: 1,
                deviceid: 'withingsDevideId',
                measures: [
                  {
                    value: 0,
                    type: 1,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 0,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 4,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 5,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 6,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 8,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 9,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 10,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 11,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 12,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 54,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 71,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 73,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 76,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 77,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 88,
                    unit: 0,
                    algo: 0,
                    fm: 0,
                    fw: 0,
                  },
                  {
                    value: 0,
                    type: 91,
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

  it('withings init/poll is good', async () => {
    const resultInit = await withingsHandler.init('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    // logger.debug(resultInit);
    await assert.isNotNull(resultInit);

    const deviceToPoll = resultInit.next();
    deviceToPoll.features = [
      {
        id: uuid.v4(),
        type: 91,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 88,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 77,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 76,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 73,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 71,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 54,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 12,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 11,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 10,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 9,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 8,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 6,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 5,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 4,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 0,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: 1,
        last_value_changed: new Date(),
      },
    ];
    deviceToPoll.params = [
      {
        device_id: deviceToPoll.id,
        name: 'withingsDeviceId',
        value: 'withingsDevideId',
      },
    ];

    const resultPoll = await withingsHandler.poll(deviceToPoll);
    // logger.debug(resultPoll);
    return assert.isNotNull(resultPoll);
  });

  it('withings deleteVar is good', async () => {
    const result = await withingsHandler.deleteVar('req', undefined);
    return assert.isNotNull(result);
  });

  it('withings deleteDevices is not good', async () => {
    const result = await withingsHandler.deleteDevices();
    return assert.isNotNull(result);
  });
});
