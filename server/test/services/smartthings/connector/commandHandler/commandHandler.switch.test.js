const sinon = require('sinon');

const { assert, fake } = sinon;
const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../utils/constants');
const SmartthingsHandler = require('../../../../../services/smartthings/lib');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  stateManager: {},
};

const serviceId = 'be86c4db-489f-466c-aeea-1e262c4ee720';
const response = {
  addDevice: fake.returns(null),
};

describe('SmartThings service - commandHandler - switch', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('switch on', async () => {
    gladys.stateManager.get = fake.returns({
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'feature_id',
        },
      ],
    });

    const requestedDevices = [{ externalDeviceId: 'device_1', commands: [{ capability: 'st.switch', command: 'on' }] }];
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.notCalled(response.addDevice);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'feature_id',
      state: 1,
    });
  });

  it('switch off', async () => {
    gladys.stateManager.get = fake.returns({
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'feature_id',
        },
      ],
    });

    const requestedDevices = [
      { externalDeviceId: 'device_1', commands: [{ capability: 'st.switch', command: 'off' }] },
    ];
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.notCalled(response.addDevice);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'feature_id',
      state: 0,
    });
  });

  it('light on', async () => {
    gladys.stateManager.get = fake.returns({
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
          external_id: 'feature_id',
        },
      ],
    });

    const requestedDevices = [{ externalDeviceId: 'device_1', commands: [{ capability: 'st.switch', command: 'on' }] }];
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.notCalled(response.addDevice);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'feature_id',
      state: 1,
    });
  });

  it('light off', async () => {
    gladys.stateManager.get = fake.returns({
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
          external_id: 'feature_id',
        },
      ],
    });

    const requestedDevices = [
      { externalDeviceId: 'device_1', commands: [{ capability: 'st.switch', command: 'off' }] },
    ];
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.notCalled(response.addDevice);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'feature_id',
      state: 0,
    });
  });
});
