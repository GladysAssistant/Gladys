const { expect } = require('chai');

const BluetoothManager = require('../../../../../services/bluetooth/lib');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.getConfiguration', () => {
  it('get config from service', async () => {
    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    const configuration = bluetoothManager.getConfiguration();

    expect(configuration).deep.eq({
      presenceScanner: {
        frequency: 60000,
        status: 'enabled',
      },
    });
  });
});
