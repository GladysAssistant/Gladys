const sinon = require('sinon');

const { assert, fake } = sinon;

const BroadlinkDeviceHandler = require('../../../../../../services/broadlink/lib/modules/device');

describe('broadlink.device.setValue', () => {
  const gladys = {};
  const serviceId = 'service-id';

  const handler = new BroadlinkDeviceHandler(gladys, serviceId);

  const peripheral = {
    setPower: fake.returns(null),
    mac: 'mac',
  };
  const device = {};
  const feature = {
    external_id: 'broadlink:0011223344',
  };

  afterEach(() => {
    sinon.reset();
  });

  it('test on value', () => {
    const value = 1;

    handler.setValue(peripheral, device, feature, value);

    assert.calledWith(peripheral.setPower, 'on', 0);
  });

  it('test off value', () => {
    const value = 0;

    handler.setValue(peripheral, device, feature, value);

    assert.calledWith(peripheral.setPower, 0, 0);
  });

  it('test with channel', () => {
    const featureWithChannel = {
      external_id: 'broadlink:0011223344:3',
    };
    const value = 0;

    handler.setValue(peripheral, device, featureWithChannel, value);

    assert.calledWith(peripheral.setPower, 0, 3);
  });
});
