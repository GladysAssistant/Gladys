const chai = require('chai');
const { OAuth2Server } = require('oauth2-mock-server');
const sinon = require('sinon');
const serverHttpWithingsMock = require('./withings.serverMock.test');
const WithingsHandler = require('../../../../services/withings/lib');
const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { OAUTH2 } = require('../../../../services/withings/lib/oauth2-client/utils/constants');

const { assert, fake } = sinon;

const serverHost = 'localhost';
const httpServerPort = 9192;
const oauth2ServerPort = 9292;

const server = serverHttpWithingsMock.getHttpServer(serverHost, httpServerPort, false);
const serverOauth2 = new OAuth2Server();

let countGetValueCall = 0;
let countGetValueCallClientId = 0;

const gladys = {
  variable: {
    getValue: function returnValue(key, serviceId, userId) {
      countGetValueCall += 1;
      if (key === OAUTH2.VARIABLE.CLIENT_ID) {
        countGetValueCallClientId += 1;
      }
      return serverHttpWithingsMock.getVariable(key);
    },
    setValue: fake.resolves(null),
    destroy: fake.returns(null),
  },
  device: {
    create: fake.resolves(null),
    destroyByServiceId: fake.resolves(null),
    saveState: fake.resolves(null),
    saveHistoricalState: fake.resolves(null),
  },
  user: {
    get: fake.resolves([{ id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' }]),
  },
  event: { emit: fake.returns(null) },
};

describe('WithingsHandler poll', () => {
  const withingsHandler = new WithingsHandler(gladys, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4');
  withingsHandler.withingsUrl = `http://${serverHost}:${httpServerPort}`;
  withingsHandler.oauth2Client.tokenHost = `http://${serverHost}:${oauth2ServerPort}`;
  withingsHandler.oauth2Client.authorizeHost = `http://${serverHost}:${oauth2ServerPort}`;

  before((done) => {
    server.start(done);

    // Start fake oatuh2 server
    // Generate a new RSA key and add it to the keystore
    serverOauth2.issuer.keys.generate('RS256');
    // Start the server
    serverOauth2.start(oauth2ServerPort, serverHost);
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
      external_id: 'withingsDevideId',
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

    chai.assert.equal(countGetValueCall, 52);
    chai.assert.equal(countGetValueCallClientId, 18);

    assert.callCount(gladys.device.saveState, 1);
    // 17 feature - 1 feature unknown = 16 state to save
    assert.callCount(gladys.device.saveHistoricalState, 16);
    assert.calledWith(gladys.device.saveHistoricalState, deviceToPoll.features[0]);

    const deviceToPoll2 = {
      id: 'gdfgdfgd-7207-4e55-b893-gfdgdfgkjliu',
      name: 'Withings - string',
      model: 'string',
      poll_frequency: 86400000,
      selector: 'withings-string-9f66c962-7207-4e55-b893-712642f5e043',
      service_id: '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
      should_poll: true,
      external_id: 'withingsDevideId2',
    };
    deviceToPoll2.features = [
      {
        id: '832fd6ce-9c2b-4806-bd0f-fbc9bb2432a4',
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        last_value_changed: new Date(),
      },
    ];
    await withingsHandler.poll(deviceToPoll2);

    assert.calledWith(gladys.device.saveHistoricalState, deviceToPoll.features[0]);

    const deviceToPoll3 = {
      id: 'gdfgdfgd-7207-4e55-b893-gfdgdfgkjliu',
      name: 'Withings - string',
      model: 'string',
      poll_frequency: 86400000,
      selector: 'withings-string-9f66c962-7207-4e55-b893-712642f5e043',
      service_id: '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
      should_poll: true,
      external_id: 'withingsDevideId3',
    };
    deviceToPoll3.features = [
      {
        id: '832fd6ce-9c2b-4806-bd0f-fbc9bb2432a4',
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        last_value_changed: new Date(),
      },
    ];
    await withingsHandler.poll(deviceToPoll3);

    assert.calledWith(gladys.device.saveHistoricalState, deviceToPoll.features[0]);

    const deviceToPoll4 = {
      id: 'gdfgdfgd-7207-4e55-b893-gfdgdfgkjliu',
      name: 'Withings - string',
      model: 'string',
      poll_frequency: 86400000,
      selector: 'withings-string-9f66c962-7207-4e55-b893-712642f5e043',
      service_id: '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
      should_poll: true,
      external_id: 'withingsDevideId4',
    };
    deviceToPoll4.features = [
      {
        id: '832fd6ce-9c2b-4806-bd0f-fbc9bb2432a4',
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        last_value_changed: new Date(),
      },
    ];
    await withingsHandler.poll(deviceToPoll4);

    assert.calledWith(gladys.device.saveHistoricalState, deviceToPoll.features[0]);
  });
});
