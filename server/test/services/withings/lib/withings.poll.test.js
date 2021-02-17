const { expect } = require('chai');
const ServerMock = require('mock-http-server');
const { OAuth2Server } = require('oauth2-mock-server');
const sinon = require('sinon');
const uuid = require('uuid');
const WithingsHandler = require('../../../../services/withings/lib');
const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const { assert, fake } = sinon;

const serverOauth2 = new OAuth2Server();

const server = new ServerMock({ host: 'localhost', port: 9192 }, null);

const gladys = {
  variable: {
    getValue: fake.resolves(
      '{"access_token":"b96a86b654acb01c2aeb4d5a39f10ff9c964f8e4","expires_in":10800,' +
      '"token_type":"Bearer",' +
      '"scope":"user.info,user.metrics,user.activity,user.sleepevents",' +
      '"refresh_token":"11757dc7fd8d25889f5edfd373d1f525f53d4942",' +
      '"userid":"33669966",' +
      '"expires_at":"2020-11-13T20:46:50.042Z"}',
    ),
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

  after((done) => {
    server.stop(done);
    serverOauth2.stop();
  });

  const now = new Date();
  let clock;

  beforeEach(() => {
    sinon.reset();
    clock = sinon.useFakeTimers(now.getTime());
  });

  afterEach(() => {
    clock.restore();
  });

  it('should poll devices', async () => {
    const resultInit = await withingsHandler.init('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    expect(resultInit.next().value.name).to.equal('Withings - string');

    const deviceToPoll = resultInit.next();
    deviceToPoll.features = [
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.WEIGHT,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.UNKNOWN,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.TEMPERATURE,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.SYSTOLIC_BLOOD_PRESSURE,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.SPO2,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.SKIN_TEMPERATURE,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.PULSE_WAVE_VELOCITY,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.MUSCLE_MASS,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.HYDRATION,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.HEIGHT,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.HEARTH_PULSE,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.FAT_RATIO,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.FAT_MASS_WEIGHT,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.FAT_FREE_MASS,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.DIASTOLIC_BLOOD_PRESSURE,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.BONE_MASS,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.HEALTH.BODY_TEMPERATURE,
        last_value_changed: new Date(),
      },
      {
        id: uuid.v4(),
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
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

    await withingsHandler.poll(deviceToPoll);

    assert.callCount(gladys.variable.getValue, 58);
    assert.calledWithExactly(
      gladys.variable.getValue,
      'WITHINGS_CLIENT_ID',
      '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    );

    const expectedValues = {
      done: false,
      features: [{
        id: 'eb38855f-34d2-4fa5-9462-9f27fa7b7f28',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'weight'
      }, {
        id: '6e0483c9-fa83-4604-8551-9e2fac92a22d',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'unknown'
      }, {
        id: '76e8e4bd-c918-4189-8be8-62b4ae5d87a2',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'temperature'
      }, {
        id: '439f5272-5f71-434d-93c9-546ff5224ea0',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'systolic-blood-pressure'
      }, {
        id: 'eec9c397-f1cb-4308-903a-5195f54db496',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'sp-o2'
      }, {
        id: '1075b0de-1588-4312-b18c-122f0e574ea2',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'skin-temperature'
      }, {
        id: '7e8a94ce-895f-418e-b227-8203c1e424cc',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'pulse-wave-velocity'
      }, {
        id: '0049b2a0-31b6-4f4a-b4da-c4d0bb991d23',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'muscle-mass'
      }, {
        id: '97da2348-9acf-430e-b3d1-0f5c1046a7d4',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'hydration'
      }, {
        id: 'd34ee631-e405-494c-a215-6fb69df24781',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'height'
      }, {
        id: 'e4a91381-e4b2-4a44-b531-46528541cba1',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'heart-pulse'
      }, {
        id: '25be3e06-4624-4da3-9b6e-2ef31c5cd79c',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'fat-ratio'
      }, {
        id: '5f754d75-6775-464a-9502-fe773e92ec2c',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'fat-mass-weight'
      }, {
        id: '11994e2d-c184-45e9-a211-6124a8bc7a7f',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'fat-free-mass'
      }, {
        id: '13aa3279-6255-44b8-9416-d8cda1cdf66f',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'diastolic-blood-pressure'
      }, {
        id: '2913dba8-9825-4a6a-baf9-709022b30247',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'bone-mass'
      }, {
        id: '06497a58-69c3-461f-aaea-81b99184f361',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'body-temperature'
      }, {
        id: '332f6ae2-b9b4-493c-9cba-769673c16a60',
        last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
        type: 'integer'
      }],
      params: [{ device_id: undefined, name: 'withingsDeviceId', value: 'withingsDevideId' }],
      value: {
        external_id: 'ced8145f-c641-4ddd-ac09-3e21dd33f966',
        features: [{
          category: 'battery',
          device_id: 'ced8145f-c641-4ddd-ac09-3e21dd33f966',
          external_id: 'ced8145f-c641-4ddd-ac09-3e21dd33f966',
          feature_state: [{
            created_at: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
            device_feature_id: 'ce508dc0-1b37-4018-a5c2-99d1581f9ced',
            id: '282e2835-efe8-4b48-ac12-e36a068beacb',
            updated_at: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
            value: 0
          }],
          has_feedback: false,
          id: 'ce508dc0-1b37-4018-a5c2-99d1581f9ced',
          keep_history: false,
          last_value: 0,
          last_value_changed: 'Mon Feb 01 2021 09:09:48 GMT+0100 (GMT+01:00)',
          last_value_string: 'No value',
          max: 0,
          min: 0,
          name: 'Battery',
          read_only: true,
          selector: 'withings-battery-ced8145f-c641-4ddd-ac09-3e21dd33f966',
          type: 'integer',
          unit: 'percent'
        }, undefined],
        id: 'ced8145f-c641-4ddd-ac09-3e21dd33f966',
        model: 'string',
        name: 'Withings - string',
        params: [{ name: 'withingsDeviceId', value: 'withingsDevideId2' }],
        poll_frequency: 86400000,
        room_id: null,
        selector: 'withings-string-ced8145f-c641-4ddd-ac09-3e21dd33f966',
        service_id: '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
        should_poll: true
      }
    };

    assert.callCount(gladys.device.saveHistoricalState, 1);
    assert.calledWithExactly(gladys.device.saveHistoricalState, expectedValues);
  });
});
