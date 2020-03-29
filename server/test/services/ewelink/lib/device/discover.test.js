const chai = require('chai');
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const GladysUnhandledDevice = require('../../mocks/Gladys-unhandled.json');
const Gladys2Ch1Device = require('../../mocks/Gladys-2ch1.json');
const Gladys2Ch2Device = require('../../mocks/Gladys-2ch2.json');
const EweLinkApi = require('../../mocks/ewelink-api.mock.test');
const EweLinkApiEmpty = require('../../mocks/ewelink-api-empty.mock.test');

chai.use(deepEqualInAnyOrder);
const { expect } = chai;

const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApi,
});
const EwelinkServiceEmpty = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApiEmpty,
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
const gladysWithoutDevices = {
  variable,
  event,
  stateManager: {
    get: (key, externalId) => {
      return undefined;
    },
  },
};
const gladysWithThreeDevice = {
  variable,
  event,
  stateManager: {
    get: (key, externalId) => {
      if (externalId === 'ewelink:10004531ae:0') {
        return GladysPowDevice;
      }
      if (externalId === 'ewelink:10004533ae:1') {
        return Gladys2Ch1Device;
      }
      if (externalId === 'ewelink:10004533ae:2') {
        return Gladys2Ch2Device;
      }
      return undefined;
    },
  },
};

describe('EwelinkHandler discover', () => {
  it('should found 5 devices, 5 of wich are new unknown devices', async () => {
    const eweLinkService = EwelinkService(gladysWithoutDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await eweLinkService.device.discover();
    expect(newDevices).to.deep.equalInAnyOrder([
      GladysPowDevice,
      GladysOfflineDevice,
      GladysUnhandledDevice,
      Gladys2Ch1Device,
      Gladys2Ch2Device,
    ]);
  });
  it('should found 5 devices, 3 of wich are already in Gladys and 1 are a new unknown device', async () => {
    const eweLinkService = EwelinkService(gladysWithThreeDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await eweLinkService.device.discover();
    expect(newDevices).to.deep.equalInAnyOrder([GladysOfflineDevice, GladysUnhandledDevice]);
  });
  it('should found 0 devices', async () => {
    const eweLinkService = EwelinkServiceEmpty(gladysWithoutDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await eweLinkService.device.discover();
    expect(newDevices).to.deep.equalInAnyOrder([]);
  });
});
