const { expect } = require('chai');

const LANManager = require('../../../../services/lan-manager/lib');

const gladys = {};
const serviceId = '2f3b1972-63ec-4a9b-b46c-d87611feba69';

describe('LANManager stop', () => {
  let manager;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, null);
  });

  it('stop service', async () => {
    manager.scanning = true;

    manager.stop();

    expect(manager.discoveredDevices).to.deep.equal([]);
    expect(manager.scanning).to.equal(false);
  });
});
