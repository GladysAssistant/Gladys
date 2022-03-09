const { assert } = require('chai');
const { OAuth2Server } = require('oauth2-mock-server');
const { fake } = require('sinon');
const ServerMock = require('mock-http-server');
const OAuth2Manager = require('../../../../lib/oauth2/index');
const WithingsHandler = require('../../../../services/withings/lib');
const { OAUTH2 } = require('../../../../utils/constants.js');

const serverOauth2 = new OAuth2Server();
const server = new ServerMock({ host: 'localhost', port: 9192 }, null);

const gladys = {
  device: {
    create: fake.returns(null),
    destroyByServiceId: fake.returns(null),
    get: function getFakeDevice() {
      return [
        {
          name: 'Withings - string',
          params: [
            {
              name: 'WITHINGS_DEVICE_ID',
              value: 'withingsDevideId4',
            },
          ],
        },
      ];
    },
    saveHistoricalState: function shs(device, featureBattery, featureState) {
      device.featureBattery = featureBattery;
      device.featureBattery = featureState;
    },
  },
  user: {
    get: fake.returns([{ id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' }]),
  },
  event: { emit: fake.returns(null) },
  variable: {
    getValue: function returnValue(key, serviceId) {
      switch (key) {
        case OAUTH2.VARIABLE.TOKEN_HOST:
          return 'http://localhost:9292';
        case OAUTH2.VARIABLE.TOKEN_PATH:
          return '/oauth2/token';
        case OAUTH2.VARIABLE.REDIRECT_URI_SUFFIX:
          return 'ashboard/integration/health/test/settings';
        case OAUTH2.VARIABLE.AUTHORIZE_HOST:
          return 'http://localhost:9292';
        case OAUTH2.VARIABLE.AUTHORIZE_PATH:
          return '/oauth2_user/authorize2';
        case OAUTH2.VARIABLE.GRANT_TYPE:
          return 'authorization_code';
        case OAUTH2.VARIABLE.INTEGRATION_SCOPE:
          return 'user.info,user.metrics,user.activity,user.sleepevents';
        case OAUTH2.VARIABLE.ACCESS_TOKEN:
          return (
            '{' +
            '"access_token":"b96a86b654acb01c2aeb4d5a39f10ff9c964f8e4",' +
            '"expires_in":10800,' +
            '"token_type":"Bearer",' +
            '"scope":"user.info,user.metrics,user.activity,user.sleepevents",' +
            '"refresh_token":"11757dc7fd8d25889f5edfd373d1f525f53d4942",' +
            '"userid":"33669966",' +
            '"expires_at":"2020-11-13T20:46:50.042Z"' +
            '}'
          );
        default:
          return '';
      }
    },
    setValue: fake.returns(null),
    destroy: fake.returns(null),
  },
};

describe('WithingsHandler init', () => {
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
    serverOauth2.issuer.keys.generate('RS256');
    // Start the server
    serverOauth2.start(9292, 'localhost');

    gladys.oauth2Client = new OAuth2Manager(gladys.variable);
  });

  after(function testAfter(done) {
    server.stop(done);
    serverOauth2.stop();
  });
  it('init devices in Gladys', async () => {
    const withingsHandler = new WithingsHandler(
      gladys,
      '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
      'http://localhost:9192',
      'test',
    );

    const result = await withingsHandler.init('0cd30aef-9c4e-4a23-88e3-3547971296e5');

    const firstResult = result[0];
    const secondResult = result[1];
    const thirdResult = result[2];
    const fourResult = result[3];

    await assert.equal(firstResult.name, 'Withings - string');
    await assert.equal(firstResult.service_id, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4');
    await assert.equal(firstResult.should_poll, true);
    await assert.equal(firstResult.poll_frequency, 86400000);

    const featureCreated = firstResult.features;
    await assert.equal(featureCreated.length, 18);

    let paramCreated = firstResult.params;
    await assert.equal(paramCreated.length, 1);
    await assert.equal(paramCreated[0].name, 'WITHINGS_DEVICE_ID');
    await assert.equal(paramCreated[0].value, 'withingsDevideId');

    await assert.equal(secondResult.name, 'Withings - string');
    paramCreated = secondResult.params;
    await assert.equal(paramCreated.length, 1);
    await assert.equal(paramCreated[0].name, 'WITHINGS_DEVICE_ID');
    await assert.equal(paramCreated[0].value, 'withingsDevideId2');

    await assert.equal(thirdResult.name, 'Withings - string');
    paramCreated = thirdResult.params;
    await assert.equal(paramCreated.length, 1);
    await assert.equal(paramCreated[0].name, 'WITHINGS_DEVICE_ID');
    await assert.equal(paramCreated[0].value, 'withingsDevideId3');

    await assert.equal(fourResult.name, 'Withings - string');
    paramCreated = fourResult.params;
    await assert.equal(paramCreated.length, 1);
    await assert.equal(paramCreated[0].name, 'WITHINGS_DEVICE_ID');
    await assert.equal(paramCreated[0].value, 'withingsDevideId4');
  });
});
