const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const BroadlinkDeviceRM2 = function BroadlinkDeviceRM2() {};

const buildPeripheral = proxyquire(
  '../../../../../../services/broadlink/lib/modules/remote/broadlink.remote.buildPeripheral',
  {
    'broadlink-js': { BroadlinkDeviceRM2 },
  },
);

const BroadlinkRemoteHandler = proxyquire('../../../../../../services/broadlink/lib/modules/remote', {
  './broadlink.remote.buildPeripheral': buildPeripheral,
});

describe('broadlink.remote.buildPeripheral', () => {
  const gladys = {};
  const serviceId = 'service-id';

  const handler = new BroadlinkRemoteHandler(gladys, serviceId);

  it('build peripheral', () => {
    const peripheralInfo = {};

    const { peripheral, device } = handler.buildPeripheral(peripheralInfo);

    expect(device).to.be.instanceOf(BroadlinkDeviceRM2);
    expect(peripheral)
      .to.have.property('canLearn', true)
      .and.to.not.have.property('device');
  });
});
