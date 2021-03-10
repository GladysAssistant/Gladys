const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const utilsMock = {
  generateRandomBytes: () => Buffer.from([0x01, 0x02]),
  generateSessionKey: fake.returns(Buffer.from([0x05, 0x06])),
};
const commandsMock = {
  generatePairCommand: () => Buffer.from([0x03, 0x04]),
};
const proxyAuthenticate = proxyquire(
  '../../../../../../../services/awox/lib/handlers/mesh/ble/awox.mesh.ble.authenticate',
  {
    '../awox.mesh.utils': utilsMock,
    '../awox.mesh.commands': commandsMock,
  },
);
const AwoxBLEMesh = proxyquire('../../../../../../../services/awox/lib/handlers/mesh/ble', {
  './awox.mesh.ble.authenticate': proxyAuthenticate,
});
const { BLUETOOTH } = require('../../../../../../../services/awox/lib/handlers/mesh/awox.mesh.constants');
const { COMMANDS } = require('../../../../../../../services/awox/lib/handlers/mesh/ble/utils/awox.mesh.ble.constants');
const { BadParameters } = require('../../../../../../../utils/coreErrors');

describe('awox.mesh.legacy.authenticate', () => {
  const gladys = {};
  const bluetooth = {
    writeDevice: fake.resolves(null),
    readDevice: fake.resolves(null),
  };
  const peripheral = {};
  const credentials = {
    user: 'meshName',
    password: 'meshPassword',
  };

  afterEach(() => {
    sinon.reset();
  });

  it('Authenticate with success', async () => {
    bluetooth.readDevice = fake.resolves([0x0d]);

    const meshManager = new AwoxBLEMesh(gladys, bluetooth);

    await meshManager.authenticate(peripheral, credentials);

    assert.callCount(bluetooth.writeDevice, 2);
    assert.calledWith(
      bluetooth.writeDevice,
      peripheral,
      BLUETOOTH.SERVICE,
      BLUETOOTH.CHARACTERISTICS.PAIR,
      commandsMock.generatePairCommand(),
      true,
    );
    assert.calledWith(
      bluetooth.writeDevice,
      peripheral,
      BLUETOOTH.SERVICE,
      BLUETOOTH.CHARACTERISTICS.STATUS,
      COMMANDS.AUTHENTICATE,
      true,
    );

    assert.calledOnce(bluetooth.readDevice);
    assert.calledWith(bluetooth.readDevice, peripheral, BLUETOOTH.SERVICE, BLUETOOTH.CHARACTERISTICS.PAIR);
    assert.calledOnce(utilsMock.generateSessionKey);
  });

  it('Authenticate bad credentials', async () => {
    bluetooth.readDevice = fake.resolves([0x0e]);

    const meshManager = new AwoxBLEMesh(gladys, bluetooth);

    try {
      await meshManager.authenticate(peripheral, credentials);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }

    assert.callCount(bluetooth.writeDevice, 2);
    assert.calledWith(
      bluetooth.writeDevice,
      peripheral,
      BLUETOOTH.SERVICE,
      BLUETOOTH.CHARACTERISTICS.PAIR,
      commandsMock.generatePairCommand(),
      true,
    );
    assert.calledWith(
      bluetooth.writeDevice,
      peripheral,
      BLUETOOTH.SERVICE,
      BLUETOOTH.CHARACTERISTICS.STATUS,
      COMMANDS.AUTHENTICATE,
      true,
    );

    assert.calledOnce(bluetooth.readDevice);
    assert.calledWith(bluetooth.readDevice, peripheral, BLUETOOTH.SERVICE, BLUETOOTH.CHARACTERISTICS.PAIR);
    assert.notCalled(utilsMock.generateSessionKey);
  });

  it('Authenticate error', async () => {
    bluetooth.readDevice = fake.resolves([0x01]);

    const meshManager = new AwoxBLEMesh(gladys, bluetooth);

    try {
      await meshManager.authenticate(peripheral, credentials);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error);
    }

    assert.callCount(bluetooth.writeDevice, 2);
    assert.calledWith(
      bluetooth.writeDevice,
      peripheral,
      BLUETOOTH.SERVICE,
      BLUETOOTH.CHARACTERISTICS.PAIR,
      commandsMock.generatePairCommand(),
      true,
    );
    assert.calledWith(
      bluetooth.writeDevice,
      peripheral,
      BLUETOOTH.SERVICE,
      BLUETOOTH.CHARACTERISTICS.STATUS,
      COMMANDS.AUTHENTICATE,
      true,
    );

    assert.calledOnce(bluetooth.readDevice);
    assert.calledWith(bluetooth.readDevice, peripheral, BLUETOOTH.SERVICE, BLUETOOTH.CHARACTERISTICS.PAIR);
    assert.notCalled(utilsMock.generateSessionKey);
  });
});
