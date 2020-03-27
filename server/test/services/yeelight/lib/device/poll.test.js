const { expect } = require('chai');
const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const GladysDevice = require('../../mocks/Gladys-color.json');
const YeelightApi = require('../../mocks/yeelight.mock.test');

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightApi,
});

const event = {
  emit: fake.resolves(null),
};
const deviceManager = {
  get: fake.resolves([GladysDevice]),
};
const stateManager = {
  get: (key, externalId) => {
    return undefined;
  },
};

const gladys = {
  event,
  device: deviceManager,
  stateManager,
};

describe('YeelightHandler poll', () => {
  const yeelightService = YeelightService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

  it('should poll device states', async () => {
    await yeelightService.device.poll(GladysDevice);
    assert.callCount(gladys.event.emit, 2);
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'yeelight:0x00000000035ac142:binary',
      state: 0,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'yeelight:0x00000000035ac142:brightness',
      state: 50,
    });
  });
  it('should return Yeelight devices not found error', async () => {
    const notFoundDevice = {
      ...GladysDevice,
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
