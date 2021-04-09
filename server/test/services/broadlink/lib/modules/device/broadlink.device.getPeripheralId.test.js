const { expect } = require('chai');

const BroadlinkDeviceHandler = require('../../../../../../services/broadlink/lib/modules/device');

describe('broadlink.device.getPeripheralId', () => {
  const gladys = {};
  const serviceId = 'service-id';

  const handler = new BroadlinkDeviceHandler(gladys, serviceId);

  it('managed device', () => {
    const device = {
      id: 'e1ccb50f-1073-4752-bf5e-a2c1918d6341',
      external_id: 'broadlink:0011223344',
    };

    const peripheralId = handler.getPeripheralId(device);

    expect(peripheralId).to.be.eq('0011223344');
  });

  it('not managed device', () => {
    const device = {
      id: 'e1ccb50f-1073-4752-bf5e-a2c1918d6341',
      external_id: 'broadlink:e1ccb50f-1073-4752-bf5e-a2c1918d6341',
    };

    const peripheralId = handler.getPeripheralId(device);

    expect(peripheralId).to.be.eq(null);
  });
});
