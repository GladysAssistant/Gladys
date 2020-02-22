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

describe('SmartThings service - commandHandler - switchLevel', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('switchLevel setLevel', async () => {
    gladys.stateManager.get = fake.returns({
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.DIMMER,
          selector: 'feature_selector',
          min: 0,
          max: 200,
        },
      ],
    });

    const requestedDevices = [
      {
        externalDeviceId: 'device_1',
        commands: [{ capability: 'st.switchLevel', command: 'setLevel', arguments: { level: 25 } }],
      },
    ];
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.notCalled(response.addDevice);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device_feature: 'feature_selector',
      value: 50,
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
    });
  });

  it('lightLevel setLevel', async () => {
    gladys.stateManager.get = fake.returns({
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
          selector: 'feature_selector',
          min: 0,
          max: 100,
        },
      ],
    });

    const requestedDevices = [
      {
        externalDeviceId: 'device_1',
        commands: [{ capability: 'st.switchLevel', command: 'setLevel', arguments: { level: 25 } }],
      },
    ];
    await smartthingsHandler.commandHandler(response, requestedDevices);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'device_1');
    assert.notCalled(response.addDevice);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device_feature: 'feature_selector',
      value: 25,
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
    });
  });
});
