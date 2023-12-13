const { expect } = require('chai');
const sinon = require('sinon');

const { SERVICE_ID, EWELINK_INVALID_ACCESS_TOKEN, EWELINK_DENIED_ACCESS_TOKEN } = require('../constants');
const Gladys2ChDevice = require('../payloads/Gladys-2ch.json');
const GladysOfflineDevice = require('../payloads/Gladys-offline.json');
const GladysPowDevice = require('../payloads/Gladys-pow.json');
const GladysThDevice = require('../payloads/Gladys-th.json');
const GladysUnhandledDevice = require('../payloads/Gladys-unhandled.json');

const { assert } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const EweLinkApiMock = require('../ewelink-api.mock.test');
const { ServiceNotConfiguredError } = require('../../../../../utils/coreErrors');

const gladys = {
  stateManager: {
    get: (key, externalId) => {
      if (externalId === 'ewelink:10004531ae') {
        return Gladys2ChDevice;
      }
      if (externalId === 'ewelink:10004533ae') {
        return GladysPowDevice;
      }
      return undefined;
    },
  },
  event: {
    emit: () => {},
  },
  variable: {
    destroy: async () => {},
  },
};

describe('EweLinkHandler discover', () => {
  let eWeLinkHandler;

  beforeEach(() => {
    eWeLinkHandler = new EwelinkHandler(gladys, EweLinkApiMock, SERVICE_ID);
    eWeLinkHandler.ewelinkWebAPIClient = new EweLinkApiMock.WebAPI();
    eWeLinkHandler.status = { configured: true, connected: true };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should found 5 devices, 2 of wich are already in Gladys and 3 are a new unknown device', async () => {
    const newDevices = await eWeLinkHandler.discover();
    expect(newDevices.length).to.equal(5);
    expect(newDevices).to.have.deep.members([
      { ...Gladys2ChDevice, room_id: undefined, updatable: false },
      GladysOfflineDevice,
      { ...GladysPowDevice, room_id: undefined, updatable: false },
      GladysThDevice,
      GladysUnhandledDevice,
    ]);

    expect(eWeLinkHandler.discoveredDevices).to.deep.eq(newDevices);
  });

  it('should found 0 devices', async () => {
    // Force eWeLink API to give empty response
    sinon.stub(eWeLinkHandler.ewelinkWebAPIClient.device, 'getAllThingsAllPages').resolves({ error: 0, data: {} });
    const newDevices = await eWeLinkHandler.discover();
    expect(newDevices).to.have.deep.members([]);
    expect(eWeLinkHandler.discoveredDevices).to.deep.eq([]);
  });

  it('should return not configured error', async () => {
    eWeLinkHandler.ewelinkWebAPIClient.at = EWELINK_INVALID_ACCESS_TOKEN;
    try {
      await eWeLinkHandler.discover();
      assert.fail();
    } catch (error) {
      expect(error).instanceOf(ServiceNotConfiguredError);
      expect(error.message).to.equal('eWeLink: Error, service is not configured');
      expect(eWeLinkHandler.discoveredDevices).to.deep.eq([]);
    }
  });

  it('should throw an error and emit a message when AccessToken is no more valid', async () => {
    eWeLinkHandler.ewelinkWebAPIClient.at = EWELINK_DENIED_ACCESS_TOKEN;
    try {
      await eWeLinkHandler.discover();
      assert.fail();
    } catch (error) {
      expect(error).instanceOf(Error);
      expect(error.message).to.equal('eWeLink: Authentication error');
      expect(eWeLinkHandler.discoveredDevices).to.deep.eq([]);
    }
  });
});
