const { expect } = require('chai');

const LANManager = require('../../../../services/lan-manager/lib');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('LANManager getConfiguration', () => {
  let manager;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, null);
  });

  it('get config from service', async () => {
    const configuration = manager.getConfiguration();

    expect(configuration).deep.eq({
      presenceScanner: {
        frequency: 120000,
        status: 'enabled',
      },
      ipMasks: [],
    });
  });
});
