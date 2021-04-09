const { expect } = require('chai');

const BroadlinkRemoteHandler = require('../../../../../../services/broadlink/lib/modules/remote');

describe('broadlink.remote.getPeripheralId', () => {
  const gladys = {};
  const serviceId = 'service-id';

  const handler = new BroadlinkRemoteHandler(gladys, serviceId);

  it('not managed device', () => {
    const device = {
      id: 'e1ccb50f-1073-4752-bf5e-a2c1918d6341',
      external_id: 'broadlink:0011223344',
    };

    const peripheralId = handler.getPeripheralId(device);

    expect(peripheralId).to.be.eq(null);
  });

  it('managed device, no params', () => {
    const device = {
      id: 'e1ccb50f-1073-4752-bf5e-a2c1918d6341',
      external_id: 'broadlink:e1ccb50f-1073-4752-bf5e-a2c1918d6341',
    };

    const peripheralId = handler.getPeripheralId(device);

    expect(peripheralId).to.be.eq(undefined);
  });

  it('managed device, with param', () => {
    const device = {
      id: 'e1ccb50f-1073-4752-bf5e-a2c1918d6341',
      external_id: 'broadlink:e1ccb50f-1073-4752-bf5e-a2c1918d6341',
      params: [
        {
          name: 'peripheral',
          value: 'peripheralId',
        },
      ],
    };

    const peripheralId = handler.getPeripheralId(device);

    expect(peripheralId).to.be.eq('peripheralId');
  });
});
