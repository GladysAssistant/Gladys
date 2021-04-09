const { expect } = require('chai');

const BroadlinkHandler = require('../../../../../services/broadlink/lib');

describe('broadlink.getPerpiherals', () => {
  const gladys = {};
  const broadlink = {};
  const serviceId = 'service-id';

  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  it('no peripherals', () => {
    const peripherals = broadlinkHandler.getPeripherals();

    expect(peripherals).to.deep.eq([]);
  });

  it('with peripherals', () => {
    const device1 = {
      name: 'p1',
    };
    const device2 = {
      name: 'p2',
    };

    broadlinkHandler.peripherals = {
      'device-1': device1,
      'device-2': device2,
    };

    const peripherals = broadlinkHandler.getPeripherals();

    expect(peripherals).to.deep.eq([device1, device2]);
  });
});
