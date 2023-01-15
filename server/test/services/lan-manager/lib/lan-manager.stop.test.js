const { expect } = require('chai');

const LANManager = require('../../../../services/lan-manager/lib');

const gladys = {};
const serviceId = '2f3b1972-63ec-4a9b-b46c-d87611feba69';
const lanDiscovery = {};

describe('LANManager stop', () => {
  let manager;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, lanDiscovery);
  });

  it('stop service', async () => {
    manager.discoveredDevices = [{ ip: 'xxx.xxx.xxx.xxx', mac: 'xx:xx:xx:xx:xx', name: 'device1' }];
    manager.scanning = true;

    manager.stop();

    expect(manager.discoveredDevices).to.deep.equal([]);
    expect(manager.scanning).to.equal(false);
  });
});
