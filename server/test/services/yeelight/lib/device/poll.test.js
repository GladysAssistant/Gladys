const { expect } = require('chai');
const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const GladysColorDevice = require('../../mocks/gladys/color.json');
const { MockedYeelightApi, MockedEmptyYeelightApi } = require('../../mocks/yeelight.mock.test');

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': MockedYeelightApi,
});
const YeelightEmptyService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': MockedEmptyYeelightApi,
});

const gladys = {
  event: { emit: fake.resolves(null) },
  device: { get: fake.resolves([GladysColorDevice]) },
  stateManager: { get: fake.returns(undefined) },
};

describe('YeelightHandler poll', () => {
  it('returns Yeelight devices not found error when connection fails', async () => {
    const notFoundDevice = {
      ...GladysColorDevice,
      params: [{ name: 'IP_ADDRESS', value: 'fails' }, { name: 'PORT_ADDRESS', value: 55443 }],
    };
    const yeelightService = YeelightEmptyService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await expect(yeelightService.device.poll(notFoundDevice)).to.be.rejectedWith('YEELIGHT_DEVICE_NOT_FOUND');
  });
  it('returns Yeelight devices not found error when not exist', async () => {
    const notFoundDevice = {
      ...GladysColorDevice,
      params: [{ name: 'IP_ADDRESS', value: 'not_exist' }, { name: 'PORT_ADDRESS', value: 55443 }],
    };
    const yeelightService = YeelightService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await expect(yeelightService.device.poll(notFoundDevice)).to.be.rejectedWith('YEELIGHT_DEVICE_NOT_FOUND');
  });
  it('returns Yeelight devices not found error when not connected', async () => {
    const notFoundDevice = {
      ...GladysColorDevice,
      params: [{ name: 'IP_ADDRESS', value: 'not_connected' }, { name: 'PORT_ADDRESS', value: 55443 }],
    };
    const yeelightService = YeelightService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await expect(yeelightService.device.poll(notFoundDevice)).to.be.rejectedWith('YEELIGHT_DEVICE_NOT_FOUND');
  });
  it('polls device states', async () => {
    const yeelightService = YeelightService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await yeelightService.device.poll(GladysColorDevice);
    assert.callCount(gladys.event.emit, 4);
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'yeelight:0x0000000000000001:binary',
      state: 0,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'yeelight:0x0000000000000001:brightness',
      state: 50,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'yeelight:0x0000000000000001:temperature',
      state: 4000,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'yeelight:0x0000000000000001:color',
      state: 1315890,
    });
  });
});
