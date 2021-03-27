const { expect } = require('chai');

const BroadlinkHandler = require('../../../../services/broadlink/lib');

const gladys = {};
const broadlink = {};
const serviceId = 'service-id';

describe('BroadlinkHandler getPeripherals', () => {
  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  it('getPeripherals method', () => {
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
