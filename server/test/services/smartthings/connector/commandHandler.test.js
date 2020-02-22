const sinon = require('sinon');

const { assert, fake } = sinon;
const SmartthingsHandler = require('../../../../services/smartthings/lib');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  stateManager: {},
};

const serviceId = 'be86c4db-489f-466c-aeea-1e262c4ee720';
const responseDevice = {
  setError: fake.returns(null),
};
const response = {
  addDevice: fake.returns(responseDevice),
};

describe('SmartThings service - commandHandler', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    gladys.stateManager.get = fake.returns(null);
    sinon.reset();
  });

  it('device not exists', async () => {
    const requestedDevices = [{ externalDeviceId: 'device_1' }];
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.calledWith(response.addDevice, 'device_1');
    assert.calledWith(responseDevice.setError, 'Device not found in Gladys', 'DEVICE-DELETED');
    assert.notCalled(gladys.event.emit);
  });

  it('capability not exists', async () => {
    const requestedDevices = [{ externalDeviceId: 'device_1', commands: [{ capability: 'anything' }] }];
    gladys.stateManager.get = fake.returns({});
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.calledWith(response.addDevice, 'device_1');
    assert.calledWith(responseDevice.setError, 'Impossible to handle command', 'CAPABILITY-NOT-SUPPORTED');
    assert.notCalled(gladys.event.emit);
  });

  it('commandCapability not exists', async () => {
    const requestedDevices = [
      { externalDeviceId: 'device_1', commands: [{ capability: 'st.switch', command: 'unk' }] },
    ];
    gladys.stateManager.get = fake.returns({
      features: [{ category: 'switch', type: 'binary' }],
    });
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.calledWith(response.addDevice, 'device_1');
    assert.calledWith(responseDevice.setError, 'Impossible to handle command', 'CAPABILITY-NOT-SUPPORTED');
    assert.notCalled(gladys.event.emit);
  });

  it('feature not exists', async () => {
    const requestedDevices = [{ externalDeviceId: 'device_1', commands: [{ capability: 'st.switch', command: 'on' }] }];
    gladys.stateManager.get = fake.returns({
      features: [{ category: 'switch', type: 'decimal' }],
    });
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.calledWith(response.addDevice, 'device_1');
    assert.calledWith(responseDevice.setError, 'Impossible to handle command', 'CAPABILITY-NOT-SUPPORTED');
    assert.notCalled(gladys.event.emit);
  });
});
