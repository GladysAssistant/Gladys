const sinon = require('sinon');

const { assert, fake } = sinon;
const {
  EVENTS,
  ACTIONS,
  ACTIONS_STATUS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
} = require('../../../../../utils/constants');
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

describe('SmartThings service - commandHandler - alarm', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('alarm siren', async () => {
    gladys.stateManager.get = fake.returns({
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.SIREN,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          selector: 'feature_selector',
        },
      ],
    });

    const requestedDevices = [
      { externalDeviceId: 'device_1', commands: [{ capability: 'st.alarm', command: 'siren' }] },
    ];
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.notCalled(response.addDevice);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device_feature: 'feature_selector',
      value: 1,
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
    });
  });

  it('alarm strobe', async () => {
    gladys.stateManager.get = fake.returns({
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.SIREN,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          selector: 'feature_selector',
        },
      ],
    });

    const requestedDevices = [
      { externalDeviceId: 'device_1', commands: [{ capability: 'st.alarm', command: 'strobe' }] },
    ];
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.notCalled(response.addDevice);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device_feature: 'feature_selector',
      value: 1,
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
    });
  });

  it('alarm both', async () => {
    gladys.stateManager.get = fake.returns({
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.SIREN,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          selector: 'feature_selector',
        },
      ],
    });

    const requestedDevices = [
      { externalDeviceId: 'device_1', commands: [{ capability: 'st.alarm', command: 'both' }] },
    ];
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.notCalled(response.addDevice);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device_feature: 'feature_selector',
      value: 1,
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
    });
  });

  it('alarm off', async () => {
    gladys.stateManager.get = fake.returns({
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.SIREN,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          selector: 'feature_selector',
        },
      ],
    });

    const requestedDevices = [{ externalDeviceId: 'device_1', commands: [{ capability: 'st.alarm', command: 'off' }] }];
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.notCalled(response.addDevice);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device_feature: 'feature_selector',
      value: 0,
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
    });
  });
});
