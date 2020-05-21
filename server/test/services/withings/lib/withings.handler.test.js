// const { expect } = require('chai');
const { fake } = require('sinon');
const { assert } = require('chai');
const EventEmitter = require('events');
const ServerMock = require('mock-http-server');

const logger = require('../../../../utils/logger');

const WithingsHandler = require('../../../../services/withings/lib');

const server = new ServerMock({ host: 'localhost', port: 9192 }, null);

const gladys = {
  variable: {
    getValue: fake.returns(null),
    setValue: fake.returns(null),
  },
  device: {
    create: fake.returns(null),
    destroyBySelectorPattern: fake.returns(null),
  },
  event: new EventEmitter(),
};

before(function(done) {
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
});

after(function(done) {
  server.stop(done);
});

describe('WithingsHandler', () => {
  const withingsHandler = new WithingsHandler(gladys, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4', 'http://localhost:9192');

  it('withings serviceId is not good', async () => {
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
    );

    const result = await badWithingsHandler.saveVar('789dsfds452fsdq27fze2ds', 'fdsf847f5re3f92d1', 'test', null);
    return assert.equal(result.success, false);
  });

  it('withings setVar must send success = true', async () => {
    const result = await withingsHandler.saveVar('789dsfds452fsdq27fze2ds', 'fdsf847f5re3f92d1', 'test', null);
    return assert.equal(result.success, true);
  });

  it('withings init is not good', async () => {
    const req = {
      accessTokenResponse: {
        token_type: 'Bearer',
        access_token: 'b2f2c27f0bf3414e0fe3facfba7be9455109409a',
        refresh_token: 'f58e6331f741v5fe3facfba7be9455109409ae87',
      },
    };
    const result = await withingsHandler.init(req);
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

  it('withings deleteVar is not good', async () => {
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
