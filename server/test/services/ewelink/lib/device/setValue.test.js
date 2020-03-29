const { assert } = require('chai');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const Gladys2Ch1Device = require('../../mocks/Gladys-2ch1.json');
const EweLinkApi = require('../../mocks/ewelink-api.mock.test');

const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApi,
});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  variable: {
    getValue: (valueId, serviceId) => {
      if (valueId === 'EWELINK_EMAIL') {
        return Promise.resolve('email@valid.ok');
      }
      if (valueId === 'EWELINK_PASSWORD') {
        return Promise.resolve('password');
      }
      return Promise.resolve(undefined);
    },
  },
};

describe('EweLinkHandler setValue', () => {
  const eweLinkService = EwelinkService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

  it('should set binary value of the device with 1 feature', async () => {
    await eweLinkService.device.setValue(Gladys2Ch1Device, { category: 'switch', type: 'binary' }, 1);
  });
  it('should set binary value of the device with 2 features', async () => {
    await eweLinkService.device.setValue(GladysPowDevice, { category: 'switch', type: 'binary' }, 1);
  });
  it('should do nothing because of the feature type is not handled yet', async () => {
    await eweLinkService.device.setValue(GladysPowDevice, { category: 'switch', type: 'not_handled' }, 1);
  });
  it('should return EweLink device not found error', () => {
    const promise = eweLinkService.device.setValue(GladysOfflineDevice, { category: 'switch', type: 'binary' }, 1);
    assert.isRejected(promise, 'EWeLink error: Device is not currently online');
  });
});
