const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const Gladys2Ch1Device = require('../../mocks/Gladys-2ch1.json');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const GladysThDevice = require('../../mocks/Gladys-th.json');
const EwelinkApi = require('../../mocks/ewelink-api.mock.test');

const { assert, fake } = sinon;
const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EwelinkApi,
});

const variable = {
  getValue: (valueId, serviceId) => {
    if (valueId === 'EWELINK_EMAIL') {
      return Promise.resolve('email@valid.ok');
    }
    if (valueId === 'EWELINK_PASSWORD') {
      return Promise.resolve('password');
    }
    return Promise.resolve(undefined);
  },
};
const event = { emit: fake.returns(null) };
const deviceManager = {
  get: fake.resolves([GladysPowDevice, Gladys2Ch1Device, GladysOfflineDevice]),
};

const gladys = {
  variable,
  event,
  device: deviceManager,
  stateManager: {
    get: (key, externalId) => {
      if (externalId === 'ewelink:10004533ae:1') {
        return Gladys2Ch1Device;
      }
      if (externalId === 'ewelink:10004532ae:0') {
        return GladysOfflineDevice;
      }
      if (externalId === 'ewelink:10004531ae:0') {
        return GladysPowDevice;
      }
      if (externalId === 'ewelink:10004535ae:0') {
        return GladysThDevice;
      }
      return undefined;
    },
  },
};

describe('EwelinkHandler poll', () => {
  const ewelinkService = EwelinkService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  ewelinkService.device.connect();

  beforeEach(() => {
    sinon.reset();
  });

  it('should poll device and emit 1 state', async () => {
    await ewelinkService.device.poll(Gladys2Ch1Device);
    assert.callCount(gladys.event.emit, 1);
  });
  it('should poll device and emit 2 states', async () => {
    await ewelinkService.device.poll(GladysPowDevice);
    assert.callCount(gladys.event.emit, 2);
  });
  it('should poll device and emit 3 states', async () => {
    await ewelinkService.device.poll(GladysThDevice);
    assert.callCount(gladys.event.emit, 3);
  });
  it('should throws an error if device is offline', async () => {
    const promise = ewelinkService.device.poll(GladysOfflineDevice);
    chai.assert.isRejected(promise, 'EWeLink device is not currently online.');
  });
});
