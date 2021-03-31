const { expect } = require('chai');

const BroadlinkRemoteHandler = require('../../../../../../services/broadlink/lib/modules/remote');

describe('broadlink.remote.matchPeripheral', () => {
  const gladys = {};
  const serviceId = 'service-id';

  const handler = new BroadlinkRemoteHandler(gladys, serviceId);

  it('managed "unknow" device', () => {
    const peripheralInfo = {
      module: 'unknow',
    };

    const match = handler.matchPeripheral(peripheralInfo);

    expect(match).to.be.eq(true);
  });

  it('managed rm2 device', () => {
    const peripheralInfo = {
      module: 'rm2',
    };

    const match = handler.matchPeripheral(peripheralInfo);

    expect(match).to.be.eq(true);
  });

  it('not managed other device', () => {
    const peripheralInfo = {
      module: 'other',
    };

    const match = handler.matchPeripheral(peripheralInfo);

    expect(match).to.be.eq(false);
  });
});
