const { expect } = require('chai');
const sinon = require('sinon');

const { stub, assert } = sinon;

const LANManager = require('../../../../services/lan-manager/lib');

const gladys = {};
const serviceId = '2f3b1972-63ec-4a9b-b46c-d87611feba69';

describe('LANManager getDiscoveredDevices', () => {
  let manager;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, null);
    gladys.stateManager = {
      get: stub()
        .returns(null)
        .onCall(0)
        .returns({ id: 'existing-id', features: [] }),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('get empty discovered devices', async () => {
    const discoveredDevices = manager.getDiscoveredDevices();
    expect(discoveredDevices).is.deep.eq([]);
    assert.notCalled(gladys.stateManager.get);
  });

  it('get discovered devices', async () => {
    const devices = [
      { ip: 'xxx.xxx.xxx.xxx', mac: 'xx:xx:xx:xx:xx', name: 'device1' },
      { ip: 'yyy.yyy.yyy.yyy', mac: 'yy:yy:yy:yy:yy', name: 'device2' },
    ];
    manager.discoveredDevices = devices;

    const discoveredDevices = manager.getDiscoveredDevices();
    expect(discoveredDevices).to.be.lengthOf(devices.length);
    expect(discoveredDevices[0]).to.have.property('id', 'existing-id');

    assert.calledTwice(gladys.stateManager.get);
    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'lan-manager:xxxxxxxxxx');
    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'lan-manager:yyyyyyyyyy');
  });

  it('get discovered devices, filter already existing', async () => {
    const devices = [
      { ip: 'xxx.xxx.xxx.xxx', mac: 'xx:xx:xx:xx:xx', name: 'device1' },
      { ip: 'yyy.yyy.yyy.yyy', mac: 'yy:yy:yy:yy:yy', name: 'device2' },
    ];
    manager.discoveredDevices = devices;

    const discoveredDevices = manager.getDiscoveredDevices({ filterExisting: true });
    expect(discoveredDevices).to.be.lengthOf(1);
  });
});
