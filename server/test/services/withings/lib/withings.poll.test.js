const ServerMock = require('mock-http-server');
const chai = require('chai');
const { OAuth2Server } = require('oauth2-mock-server');
const sinon = require('sinon');
const WithingsHandler = require('../../../../services/withings/lib');
const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { OAUTH2 } = require('../../../../utils/constants.js');

const { assert, fake } = sinon;

const serverOauth2 = new OAuth2Server();

const server = new ServerMock({ host: 'localhost', port: 9192 }, null);

let countGetValueCall = 0;
let countGetValueCallClientId = 0;

const gladys = {
  variable: {
    getValue: function returnValue(key, serviceId, userId) {
      countGetValueCall += 1;
      switch (key) {
        case `${OAUTH2.VARIABLE.TOKEN_HOST}`:
          return 'http://localhost:9292';
        case `${OAUTH2.VARIABLE.TOKEN_PATH}`:
          return '/oauth2/token';
        case `${OAUTH2.VARIABLE.REDIRECT_URI_SUFFIX}`:
          return 'ashboard/integration/health/test/settings';
        case `${OAUTH2.VARIABLE.AUTHORIZE_HOST}`:
          return 'http://localhost:9292';
        case `${OAUTH2.VARIABLE.AUTHORIZE_PATH}`:
          return '/oauth2_user/authorize2';
        case `${OAUTH2.VARIABLE.GRANT_TYPE}`:
          return 'authorization_code';
        case `${OAUTH2.VARIABLE.INTEGRATION_SCOPE}`:
          return 'user.info,user.metrics,user.activity,user.sleepevents';
        case `${OAUTH2.VARIABLE.ACCESS_TOKEN}`:
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
        case `${OAUTH2.VARIABLE.CLIENT_ID}`:
          countGetValueCallClientId += 1;
          return 'fake_client_id';
        default:
          return '';
      }
    },
    setValue: fake.resolves(null),
    destroy: fake.returns(null),
  },
  device: {
    create: fake.resolves(null),
    destroyBySelectorPattern: fake.resolves(null),
    saveHistoricalState: fake.resolves(null),
  },
  user: {
    get: fake.resolves([{ id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' }]),
  },
  event: { emit: fake.returns(null) },
};

let batteryValue = 'low';

describe('WithingsHandler poll', () => {
  const withingsHandler = new WithingsHandler(
    gladys,
    '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
    'http://localhost:9192',
    'test',
  );

  before((done) => {
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
                battery: batteryValue,
                deviceid: 'withingsDevideId',
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

  after((done) => {
    server.stop(done);
    serverOauth2.stop();
  });

  it('should poll devices', async () => {
    const deviceToPoll = {
      id: 'gdfgdfgd-7207-4e55-b893-gfdgdfgkjliu',
      name: 'Withings - string',
      model: 'string',
      poll_frequency: 86400000,
      selector: 'withings-string-9f66c962-7207-4e55-b893-712642f5e043',
      service_id: '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
      should_poll: true,
      external_id: '9f66c962-7207-4e55-b893-712642f5e043',
      params: [
        {
          name: 'withingsDeviceId',
          value: 'withingsDevideId',
        },
      ],
    };
    deviceToPoll.features = [
      {
        id: '02b64a40-1de8-4e33-a4bc-03d86e1c567e',
        type: DEVICE_FEATURE_TYPES.HEALTH.WEIGHT,
        last_value_changed: new Date(),
      },
      {
        id: 'b4d554e0-f0f3-469d-89e2-903464eaa9d9',
        type: DEVICE_FEATURE_TYPES.HEALTH.UNKNOWN,
        last_value_changed: new Date(),
      },
      {
        id: '5ee4d59b-5a7f-440f-8225-0493b0a68547',
        type: DEVICE_FEATURE_TYPES.HEALTH.TEMPERATURE,
        last_value_changed: new Date(),
      },
      {
        id: '13e6dfbd-3fb1-4754-b4d2-5bc3352df9b1',
        type: DEVICE_FEATURE_TYPES.HEALTH.SYSTOLIC_BLOOD_PRESSURE,
        last_value_changed: new Date(),
      },
      {
        id: 'ca17a161-2b93-4b0a-8539-b2e19543a3bb',
        type: DEVICE_FEATURE_TYPES.HEALTH.SPO2,
        last_value_changed: new Date(),
      },
      {
        id: '759f03c6-f57f-4bf4-bc21-2aa3df104d8e',
        type: DEVICE_FEATURE_TYPES.HEALTH.SKIN_TEMPERATURE,
        last_value_changed: new Date(),
      },
      {
        id: 'ca1f332d-d098-4718-80bc-76ca44689d54',
        type: DEVICE_FEATURE_TYPES.HEALTH.PULSE_WAVE_VELOCITY,
        last_value_changed: new Date(),
      },
      {
        id: 'b4029e8d-c836-4599-913f-ce7775c2a79d',
        type: DEVICE_FEATURE_TYPES.HEALTH.MUSCLE_MASS,
        last_value_changed: new Date(),
      },
      {
        id: 'c0d48de3-41bb-4ac0-8584-496bf9681a91',
        type: DEVICE_FEATURE_TYPES.HEALTH.HYDRATION,
        last_value_changed: new Date(),
      },
      {
        id: '976bea5c-5a48-4602-b521-5b392f08ac1e',
        type: DEVICE_FEATURE_TYPES.HEALTH.HEIGHT,
        last_value_changed: new Date(),
      },
      {
        id: '8bcea9af-990b-4a95-bd92-c0410e53a82a',
        type: DEVICE_FEATURE_TYPES.HEALTH.HEARTH_PULSE,
        last_value_changed: new Date(),
      },
      {
        id: '74a3193b-eb39-4d69-b56d-d7d92813dddb',
        type: DEVICE_FEATURE_TYPES.HEALTH.FAT_RATIO,
        last_value_changed: new Date(),
      },
      {
        id: 'f984aa1f-92bc-4e5e-958b-2ec09aa4c6f3',
        type: DEVICE_FEATURE_TYPES.HEALTH.FAT_MASS_WEIGHT,
        last_value_changed: new Date(),
      },
      {
        id: 'f70459f5-6671-4c9f-bc27-3c4da4eb7fa1',
        type: DEVICE_FEATURE_TYPES.HEALTH.FAT_FREE_MASS,
        last_value_changed: new Date(),
      },
      {
        id: 'eb7e1015-180d-41a7-a77a-f89b768c3da9',
        type: DEVICE_FEATURE_TYPES.HEALTH.DIASTOLIC_BLOOD_PRESSURE,
        last_value_changed: new Date(),
      },
      {
        id: '7143a011-7393-48dd-b819-9b9a93d0a33a',
        type: DEVICE_FEATURE_TYPES.HEALTH.BONE_MASS,
        last_value_changed: new Date(),
      },
      {
        id: 'feb624ed-5d88-47ae-aaee-33f8069a78e5',
        type: DEVICE_FEATURE_TYPES.HEALTH.BODY_TEMPERATURE,
        last_value_changed: new Date(),
      },
      {
        id: '832fd6ce-9c2b-4806-bd0f-fbc9bb2432a4',
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        last_value_changed: new Date(),
      },
    ];

    await withingsHandler.poll(deviceToPoll);

    chai.assert.equal(countGetValueCall, 137);
    chai.assert.equal(countGetValueCallClientId, 18);

    const deviceDef = {
      id: 'gdfgdfgd-7207-4e55-b893-gfdgdfgkjliu',
      name: 'Withings - string',
      model: 'string',
      poll_frequency: 86400000,
      selector: 'withings-string-9f66c962-7207-4e55-b893-712642f5e043',
      service_id: '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
      should_poll: true,
      external_id: '9f66c962-7207-4e55-b893-712642f5e043',
      params: [{ name: 'withingsDeviceId', value: 'withingsDevideId' }],
      features: deviceToPoll.features,
    };

    // 18 feature - 1 feature unknown = 17 state to save
    assert.callCount(gladys.device.saveHistoricalState, 17);
    assert.calledWith(gladys.device.saveHistoricalState, deviceDef);

    batteryValue = 'medium';
    await withingsHandler.poll(deviceToPoll);
    assert.calledWith(gladys.device.saveHistoricalState, deviceDef);

    batteryValue = 'high';
    await withingsHandler.poll(deviceToPoll);
    assert.calledWith(gladys.device.saveHistoricalState, deviceDef);

    batteryValue = 'n/a';
    await withingsHandler.poll(deviceToPoll);
    assert.calledWith(gladys.device.saveHistoricalState, deviceDef);
  });
});
