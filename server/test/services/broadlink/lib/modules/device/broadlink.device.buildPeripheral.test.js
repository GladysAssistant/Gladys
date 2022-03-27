const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { BadParameters } = require('../../../../../../utils/coreErrors');

const BroadlinkDeviceSP2 = function BroadlinkDeviceSP2() {};
const BroadlinkDeviceMP1 = function BroadlinkDeviceMP1() {};

const buildPeripheral = proxyquire(
  '../../../../../../services/broadlink/lib/modules/device/broadlink.device.buildPeripheral',
  {
    'broadlink-js': { BroadlinkDeviceSP2, BroadlinkDeviceMP1 },
  },
);

const BroadlinkDeviceHandler = proxyquire('../../../../../../services/broadlink/lib/modules/device', {
  './broadlink.device.buildPeripheral': buildPeripheral,
});

describe('broadlink.device.buildPeripheral', () => {
  const gladys = {};
  const serviceId = 'service-id';

  const handler = new BroadlinkDeviceHandler(gladys, serviceId);

  it('build sp2 peripheral', () => {
    const peripheralInfo = {
      module: 'sp2',
      mac: '001122334455',
    };

    const { peripheral, device } = handler.buildPeripheral(peripheralInfo);

    expect(device).to.be.instanceOf(BroadlinkDeviceSP2);
    expect(peripheral)
      .to.have.property('device')
      .and.to.not.have.property('canLearn');
    expect(peripheral.device).to.have.property('features');
    expect(peripheral.device.features).to.have.lengthOf(1);
  });

  it('build mp1 peripheral', () => {
    const peripheralInfo = {
      module: 'mp1',
      mac: '001122334455',
    };

    const { peripheral, device } = handler.buildPeripheral(peripheralInfo);

    expect(device).to.be.instanceOf(BroadlinkDeviceMP1);
    expect(peripheral).to.have.property('device');
    expect(peripheral.device).to.have.property('features');
    expect(peripheral.device.features).to.have.lengthOf(4);
  });

  it('build unknown peripheral', () => {
    const peripheralInfo = {
      module: 'unknown',
      mac: '001122334455',
    };

    try {
      handler.buildPeripheral(peripheralInfo);
      expect.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
    }
  });
});
