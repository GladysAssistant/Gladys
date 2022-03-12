const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const GladysColorDevice = require('../../mocks/gladys/color.json');
const YeelightApi = require('../../mocks/yeelight.mock.test');

const { assert, fake } = sinon;

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightApi,
});

const gladys = {
  event: { emit: fake.resolves(null) },
  device: { get: fake.resolves([GladysColorDevice]) },
  stateManager: { get: (key, externalId) => undefined },
};

describe('YeelightHandler poll', () => {
  const yeelightService = YeelightService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

  beforeEach(() => {
    sinon.reset();
  });

  it('polls device states', async () => {
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
  it('should return Yeelight devices not found error', async () => {
    const notFoundDevice = {
      ...GladysColorDevice,
      params: [{ name: 'IP_ADDRESS', value: 'not_found' }, { name: 'PORT_ADDRESS', value: 55443 }],
    };
    try {
      await yeelightService.device.poll(notFoundDevice);
      assert.fail();
    } catch (error) {
      expect(error.message).to.equal('YEELIGHT_DEVICE_NOT_FOUND');
    }
  });
});
