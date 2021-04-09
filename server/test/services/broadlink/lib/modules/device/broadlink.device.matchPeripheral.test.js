const { expect } = require('chai');

const BroadlinkDeviceHandler = require('../../../../../../services/broadlink/lib/modules/device');

describe('broadlink.device.matchPeripheral', () => {
  const gladys = {};
  const serviceId = 'service-id';

  const handler = new BroadlinkDeviceHandler(gladys, serviceId);

  it('managed sp2 device', () => {
    const peripheralInfo = {
      module: 'sp2',
    };

    const match = handler.matchPeripheral(peripheralInfo);

    expect(match).to.be.eq(true);
  });

  it('managed mp1 device', () => {
    const peripheralInfo = {
      module: 'mp1',
    };

    const match = handler.matchPeripheral(peripheralInfo);

    expect(match).to.be.eq(true);
  });

  it('not managed unknown device', () => {
    const peripheralInfo = {
      module: 'unknown',
    };

    const match = handler.matchPeripheral(peripheralInfo);

    expect(match).to.be.eq(false);
  });
});
