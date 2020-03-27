const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const GladysDevice = require('../../mocks/Gladys-color.json');
const YeelightApi = require('../../mocks/yeelight.mock.test');

const { assert } = sinon;

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightApi,
});

describe('YeelightHandler setValue', () => {
  const yeelightService = YeelightService({}, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  const setPowerSpy = sinon.spy(YeelightApi.Yeelight.prototype, 'setPower');
  const setBrightSpy = sinon.spy(YeelightApi.Yeelight.prototype, 'setBright');

  beforeEach(() => {
    sinon.reset();
  });

  it('should set binary value', async () => {
    await yeelightService.device.setValue(GladysDevice, { category: 'light', type: 'binary' }, 1);
    assert.calledWithExactly(setPowerSpy, true);
    assert.notCalled(setBrightSpy);
  });
  it('should set brightness value', async () => {
    await yeelightService.device.setValue(GladysDevice, { category: 'light', type: 'brightness' }, 90);
    assert.notCalled(setPowerSpy);
    assert.calledWithExactly(setBrightSpy, 90);
  });
  it('should do nothing because of the feature type is not handled yet', async () => {
    await yeelightService.device.setValue(GladysDevice, { category: 'light', type: 'not_handled' }, 90);
    assert.notCalled(setPowerSpy);
    assert.notCalled(setBrightSpy);
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
    try {
      await yeelightService.device.setValue(notFoundDevice, { category: 'light', type: 'binary' }, 1);
      assert.fail();
    } catch (error) {
      expect(error.message).to.equal('YEELIGHT_DEVICE_NOT_FOUND');
    }
  });
});
