const { assert } = require('chai');
const { OAuth2Server } = require('oauth2-mock-server');
const sinon = require('sinon');
const serverHttpWithingsMock = require('./withings.serverMock.test');
const WithingsHandler = require('../../../../services/withings/lib');

const serverHost = 'localhost';
const httpServerPort = 9192;
const oauth2ServerPort = 9292;

const server = serverHttpWithingsMock.getHttpServer(serverHost, httpServerPort, true);
const serverOauth2 = new OAuth2Server();

const gladys = {
  device: {
    create: sinon.fake.returns(null),
    destroyByServiceId: sinon.fake.returns(null),
    get: function getFakeDevice() {
      return [
        {
          name: 'Withings - string',
          external_id: 'withingsDevideId4',
        },
      ];
    },
    saveHistoricalState: function shs(device, featureBattery, featureState) {
      device.featureBattery = featureBattery;
      device.featureBattery = featureState;
    },
  },
  user: {
    get: sinon.fake.returns([{ id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' }]),
  },
  event: { emit: sinon.fake.returns(null) },
  variable: {
    getValue: function returnValue(key, serviceId) {
      return serverHttpWithingsMock.getVariable(key);
    },
    setValue: sinon.fake.returns(null),
    destroy: sinon.fake.returns(null),
  },
};

describe('WithingsHandler initDevices', () => {
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

  it('init devices in Gladys', async () => {
    const withingsHandler = new WithingsHandler(gladys, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4');
    withingsHandler.withingsUrl = `http://${serverHost}:${httpServerPort}`;
    withingsHandler.oauth2Client.tokenHost = `http://${serverHost}:${oauth2ServerPort}`;
    withingsHandler.oauth2Client.authorizeHost = `http://${serverHost}:${oauth2ServerPort}`;

    const result = await withingsHandler.initDevices('0cd30aef-9c4e-4a23-88e3-3547971296e5');

    const firstResult = result[0];
    const secondResult = result[1];
    const thirdResult = result[2];
    const fourResult = result[3];

    await assert.equal(firstResult.name, 'Withings - string');
    await assert.equal(firstResult.service_id, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4');
    await assert.equal(firstResult.should_poll, true);
    await assert.equal(firstResult.poll_frequency, 86400000);

    const featureCreated = firstResult.features;
    await assert.equal(featureCreated.length, 23);
    await assert.equal(firstResult.external_id, 'withingsDevideId');

    await assert.equal(secondResult.name, 'Withings - string');
    await assert.equal(secondResult.external_id, 'withingsDevideId2');

    await assert.equal(thirdResult.name, 'Withings - string');
    await assert.equal(thirdResult.external_id, 'withingsDevideId3');

    await assert.equal(fourResult.name, 'Withings - string');
    await assert.equal(fourResult.external_id, 'withingsDevideId4');
  });
});
