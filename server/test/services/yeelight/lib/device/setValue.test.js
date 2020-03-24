const { assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const GladysDevice = require('../../Gladys-color.json');
const YeelightApi = require('../../yeelight.mock.test');

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightApi,
});

describe('YeelightHandler - setValue', () => {
  const yeelightService = YeelightService({}, 'a810b8db-6d04-4697-bed3-c4b72c996279');

  it('should set binary value', async () => {
    await yeelightService.device.setValue(GladysDevice, { category: 'light', type: 'binary' }, 1);
  });
  it('should set brightness value', async () => {
    await yeelightService.device.setValue(GladysDevice, { category: 'light', type: 'brightness' }, 90);
  });
  it('should do nothing because of the feature type is not handled yet', async () => {
    await yeelightService.device.setValue(GladysDevice, { category: 'light', type: 'not_handled' }, 90);
  });
  it('should return Yeelight device not found error', async () => {
    const notFoundDevice = {
      ...GladysDevice,
      params: [
        {
          name: 'IP_ADDRESS',
          value: 'not_found',
        },
        {
          name: 'PORT_ADDRESS',
          value: 55443,
        },
      ],
    };
    const promise = yeelightService.device.setValue(notFoundDevice, { category: 'light', type: 'binary' }, 1);
    return assert.isRejected(promise, 'YEELIGHT_DEVICE_NOT_FOUND');
  });
});
