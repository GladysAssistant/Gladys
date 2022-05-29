const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const GladysDevice = require('../../mocks/gladys/color.json');
const { MockedYeelightApi, MockedEmptyYeelightApi } = require('../../mocks/yeelight.mock.test');

const { assert } = sinon;

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': MockedYeelightApi,
});
const YeelightEmptyService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': MockedEmptyYeelightApi,
});

describe('YeelightHandler setValue', () => {
  const setPowerSpy = sinon.spy(MockedYeelightApi.Yeelight.prototype, 'setPower');
  const setBrightSpy = sinon.spy(MockedYeelightApi.Yeelight.prototype, 'setBright');
  const setCtAbxSpy = sinon.spy(MockedYeelightApi.Yeelight.prototype, 'setCtAbx');
  const setRGBSpy = sinon.spy(MockedYeelightApi.Yeelight.prototype, 'setRGB');

  beforeEach(() => {
    sinon.reset();
  });

  it('returns Yeelight device not found error when connection fails', async () => {
    const notFoundDevice = {
      ...GladysDevice,
      params: [{ name: 'IP_ADDRESS', value: 'fails' }, { name: 'PORT_ADDRESS', value: 55443 }],
    };
    const yeelightService = YeelightEmptyService({}, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await expect(
      yeelightService.device.setValue(notFoundDevice, { category: 'light', type: 'binary' }, 1),
    ).to.be.rejectedWith('YEELIGHT_DEVICE_NOT_FOUND');
  });
  it('returns Yeelight device not found error when not exist', async () => {
    const notFoundDevice = {
      ...GladysDevice,
      params: [{ name: 'IP_ADDRESS', value: 'not_exist' }, { name: 'PORT_ADDRESS', value: 55443 }],
    };
    const yeelightService = YeelightService({}, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await expect(
      yeelightService.device.setValue(notFoundDevice, { category: 'light', type: 'binary' }, 1),
    ).to.be.rejectedWith('YEELIGHT_DEVICE_NOT_FOUND');
  });
  it('returns Yeelight device not found error when not connected', async () => {
    const notFoundDevice = {
      ...GladysDevice,
      params: [{ name: 'IP_ADDRESS', value: 'not_connected' }, { name: 'PORT_ADDRESS', value: 55443 }],
    };
    const yeelightService = YeelightService({}, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await expect(
      yeelightService.device.setValue(notFoundDevice, { category: 'light', type: 'binary' }, 1),
    ).to.be.rejectedWith('YEELIGHT_DEVICE_NOT_FOUND');
  });
  it('set binary value', async () => {
    const yeelightService = YeelightService({}, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await yeelightService.device.setValue(GladysDevice, { category: 'light', type: 'binary' }, 1);
    assert.calledWithExactly(setPowerSpy, true);
    assert.notCalled(setBrightSpy);
    assert.notCalled(setCtAbxSpy);
    assert.notCalled(setRGBSpy);
  });
  it('set brightness value', async () => {
    const yeelightService = YeelightService({}, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await yeelightService.device.setValue(GladysDevice, { category: 'light', type: 'brightness' }, 90);
    assert.notCalled(setPowerSpy);
    assert.calledWithExactly(setBrightSpy, 90);
    assert.notCalled(setCtAbxSpy);
    assert.notCalled(setRGBSpy);
  });
  it('set temperature value', async () => {
    const yeelightService = YeelightService({}, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await yeelightService.device.setValue(GladysDevice, { category: 'light', type: 'temperature' }, 4000);
    assert.notCalled(setPowerSpy);
    assert.notCalled(setBrightSpy);
    assert.calledWithExactly(setCtAbxSpy, 4000);
    assert.notCalled(setRGBSpy);
  });
  it('set color value', async () => {
    const yeelightService = YeelightService({}, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await yeelightService.device.setValue(GladysDevice, { category: 'light', type: 'color' }, 1315890);
    assert.notCalled(setPowerSpy);
    assert.notCalled(setBrightSpy);
    assert.notCalled(setCtAbxSpy);
    assert.calledWithExactly(setRGBSpy, new MockedYeelightApi.Color(20, 20, 20), 'sudden');
  });
  it('does nothing because of the feature type is not handled yet', async () => {
    const yeelightService = YeelightService({}, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await yeelightService.device.setValue(GladysDevice, { category: 'light', type: 'not_handled' }, 90);
    assert.notCalled(setPowerSpy);
    assert.notCalled(setBrightSpy);
    assert.notCalled(setCtAbxSpy);
    assert.notCalled(setRGBSpy);
  });
});
