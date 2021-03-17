const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const BluetoothMock = require('../../BluetoothMock.test');

const bluetooth = new BluetoothMock();
const startMock = proxyquire('../../../../../services/bluetooth/lib/commands/bluetooth.start', {
  '@abandonware/noble': bluetooth,
});

const BluetoothManager = proxyquire('../../../../../services/bluetooth/lib', {
  './commands/bluetooth.start': startMock,
});

const gladys = {
  variable: {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  },
  device: {
    get: fake.resolves([]),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.start command', () => {
  let bluetoothManager;

  beforeEach(() => {
    bluetoothManager = new BluetoothManager(gladys, serviceId);
  });

  afterEach(() => {
    bluetooth.removeAllListeners();
    sinon.reset();
  });

  it('check listeners well added, init default values', async () => {
    await bluetoothManager.start();

    expect(bluetooth.listenerCount('stateChange')).eq(1);
    expect(bluetooth.listenerCount('scanStart')).eq(1);
    expect(bluetooth.listenerCount('scanStop')).eq(1);
    expect(bluetooth.listenerCount('discover')).eq(1);

    // All listeners
    expect(bluetooth.eventNames().length).eq(4);

    assert.callCount(gladys.variable.getValue, 2);
    assert.callCount(gladys.variable.setValue, 2);
  });

  it('check listeners well added, load default values', async () => {
    gladys.variable.getValue = fake.resolves('value');

    await bluetoothManager.start();

    expect(bluetooth.listenerCount('stateChange')).eq(1);
    expect(bluetooth.listenerCount('scanStart')).eq(1);
    expect(bluetooth.listenerCount('scanStop')).eq(1);
    expect(bluetooth.listenerCount('discover')).eq(1);

    // All listeners
    expect(bluetooth.eventNames().length).eq(4);

    assert.callCount(gladys.variable.getValue, 2);
    assert.notCalled(gladys.variable.setValue);
  });
});
