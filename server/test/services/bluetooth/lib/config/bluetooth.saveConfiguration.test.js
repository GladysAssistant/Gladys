const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const { BadParameters } = require('../../../../../utils/coreErrors');

const initPresenceScannerMock = fake.resolves(null);
const BluetoothManager = proxyquire('../../../../../services/bluetooth/lib', {
  './config/bluetooth.initPresenceScanner': { initPresenceScanner: initPresenceScannerMock },
});

const {
  VARIABLES,
  PRESENCE_STATUS,
  TIMERS,
} = require('../../../../../services/bluetooth/lib/utils/bluetooth.constants');

const gladys = {
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.saveConfiguration', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('not config param', async () => {
    const configuration = undefined;
    const expectedConfig = {
      presenceScanner: {
        frequency: TIMERS.PRESENCE,
        status: PRESENCE_STATUS.ENABLED,
      },
    };

    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    const savedConfig = await bluetoothManager.saveConfiguration(configuration);

    expect(savedConfig).deep.eq(expectedConfig);
    assert.notCalled(gladys.variable.setValue);
    assert.calledOnce(initPresenceScannerMock);
  });

  it('empty config param', async () => {
    const configuration = {};
    const expectedConfig = {
      presenceScanner: {
        frequency: TIMERS.PRESENCE,
        status: PRESENCE_STATUS.ENABLED,
      },
    };

    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    const savedConfig = await bluetoothManager.saveConfiguration(configuration);

    expect(savedConfig).deep.eq(expectedConfig);
    assert.notCalled(gladys.variable.setValue);
    assert.calledOnce(initPresenceScannerMock);
  });

  it('empty presenceScanner config param', async () => {
    const configuration = { presenceScanner: {} };
    const expectedConfig = {
      presenceScanner: {
        frequency: TIMERS.PRESENCE,
        status: PRESENCE_STATUS.ENABLED,
      },
    };

    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    const savedConfig = await bluetoothManager.saveConfiguration(configuration);

    expect(savedConfig).deep.eq(expectedConfig);
    assert.notCalled(gladys.variable.setValue);
    assert.calledOnce(initPresenceScannerMock);
  });

  it('only invalid frequency presenceScanner config param', async () => {
    const configuration = { presenceScanner: { frequency: TIMERS.SCAN } };

    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    try {
      await bluetoothManager.saveConfiguration(configuration);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }

    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(initPresenceScannerMock);
  });

  it('only frequency presenceScanner config param', async () => {
    const configuration = { presenceScanner: { frequency: 90000 } };
    const expectedConfig = {
      presenceScanner: {
        frequency: 90000,
        status: PRESENCE_STATUS.ENABLED,
      },
    };

    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    const savedConfig = await bluetoothManager.saveConfiguration(configuration);

    expect(savedConfig).deep.eq(expectedConfig);
    assert.calledOnce(gladys.variable.setValue);
    assert.calledWith(gladys.variable.setValue, VARIABLES.PRESENCE_FREQUENCY, 90000, serviceId);
    assert.calledOnce(initPresenceScannerMock);
  });

  it('only status presenceScanner config param (disabled)', async () => {
    const configuration = { presenceScanner: { status: 'any_but_enabled' } };
    const expectedConfig = {
      presenceScanner: {
        frequency: TIMERS.PRESENCE,
        status: PRESENCE_STATUS.DISABLED,
      },
    };

    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    const savedConfig = await bluetoothManager.saveConfiguration(configuration);

    expect(savedConfig).deep.eq(expectedConfig);
    assert.calledOnce(gladys.variable.setValue);
    assert.calledWith(gladys.variable.setValue, VARIABLES.PRESENCE_STATUS, PRESENCE_STATUS.DISABLED, serviceId);
    assert.calledOnce(initPresenceScannerMock);
  });

  it('only status presenceScanner config param (enabled)', async () => {
    const configuration = { presenceScanner: { status: PRESENCE_STATUS.ENABLED } };
    const expectedConfig = {
      presenceScanner: {
        frequency: TIMERS.PRESENCE,
        status: PRESENCE_STATUS.ENABLED,
      },
    };

    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    const savedConfig = await bluetoothManager.saveConfiguration(configuration);

    expect(savedConfig).deep.eq(expectedConfig);
    assert.calledOnce(gladys.variable.setValue);
    assert.calledWith(gladys.variable.setValue, VARIABLES.PRESENCE_STATUS, PRESENCE_STATUS.ENABLED, serviceId);
    assert.calledOnce(initPresenceScannerMock);
  });

  it('all presenceScanner config param', async () => {
    const configuration = { presenceScanner: { status: 'any_but_enabled', frequency: 90000 } };
    const expectedConfig = {
      presenceScanner: {
        frequency: 90000,
        status: PRESENCE_STATUS.DISABLED,
      },
    };

    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    const savedConfig = await bluetoothManager.saveConfiguration(configuration);

    expect(savedConfig).deep.eq(expectedConfig);
    assert.calledTwice(gladys.variable.setValue);
    assert.calledWith(gladys.variable.setValue, VARIABLES.PRESENCE_FREQUENCY, 90000, serviceId);
    assert.calledWith(gladys.variable.setValue, VARIABLES.PRESENCE_STATUS, PRESENCE_STATUS.DISABLED, serviceId);
    assert.calledOnce(initPresenceScannerMock);
  });
});
