const sinon = require('sinon').createSandbox();

const { expect } = require('chai');

const { assert, fake } = sinon;
const EventEmitter = require('events');
const {
  ACTIONS,
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
} = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const deviceFeatureLightBinary = {
  category: DEVICE_FEATURE_CATEGORIES.LIGHT,
  type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
};

const lightDevice = {
  features: [deviceFeatureLightBinary],
};

const deviceFeatureSwitchBinary = {
  category: DEVICE_FEATURE_CATEGORIES.SWITCH,
  type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
};

const switchDevice = {
  features: [deviceFeatureSwitchBinary],
};

describe('scene.executeSingleAction', () => {
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'light-1', lightDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.LIGHT.TURN_ON,
      devices: ['light-1'],
    });
    assert.calledWith(device.setValue, lightDevice, deviceFeatureLightBinary, 1);
  });
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'light-1', lightDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.LIGHT.TURN_OFF,
      devices: ['light-1'],
    });
    assert.calledWith(device.setValue, lightDevice, deviceFeatureLightBinary, 0);
  });
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'switch-1', switchDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      devices: ['switch-1'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 1);
  });
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'switch-1', switchDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_OFF,
      devices: ['switch-1'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 0);
  });
  it('should fail to setValue device but still resolves', async () => {
    const device = {
      setValue: fake.rejects(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'switch-1', switchDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_OFF,
      devices: ['switch-1'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 0);
  });
  it('should fail to setValue device but still resolves', async () => {
    const device = {
      setValue: fake.rejects(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'switch-1', switchDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      devices: ['switch-1'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 1);
  });
});

describe('scene.executeSingleAction multi-switch device', () => {
  const socket1 = {
    selector: 'power-strip-socket-1',
    device_id: 'power-strip-id',
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    read_only: false,
    last_value: 0,
  };
  const socket2 = { ...socket1, selector: 'power-strip-socket-2', last_value: 1 };
  const readOnlySwitch = { ...socket1, selector: 'power-strip-read-only', read_only: true };
  const powerStrip = { id: 'power-strip-id', features: [socket1, socket2, readOnlySwitch] };
  let stateManager;
  let device;
  let sceneManager;

  beforeEach(() => {
    device = { setValue: fake.resolves(null) };
    stateManager = new StateManager();
    stateManager.setState('device', 'power-strip', powerStrip);
    stateManager.setState('deviceById', 'power-strip-id', powerStrip);
    [socket1, socket2, readOnlySwitch].forEach((feature) =>
      stateManager.setState('deviceFeature', feature.selector, feature),
    );
    sceneManager = new SceneManager(stateManager, event, device);
  });

  it('should turn on only the selected switches', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      device_features: ['power-strip-socket-2'],
    });
    assert.calledOnceWithExactly(device.setValue, powerStrip, socket2, 1);
  });
  it('should toggle each selected switch from its own state', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TOGGLE,
      device_features: ['power-strip-socket-1', 'power-strip-socket-2'],
    });
    assert.calledTwice(device.setValue);
    assert.calledWith(device.setValue, powerStrip, socket1, 1);
    assert.calledWith(device.setValue, powerStrip, socket2, 0);
  });
  it('should turn off only the first writable switch of a device selected the legacy way', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_OFF,
      devices: ['power-strip'],
    });
    assert.calledOnceWithExactly(device.setValue, powerStrip, socket1, 0);
  });
  it('should skip the read only switches of a device selected the legacy way', async () => {
    const wallSwitch = { id: 'wall-switch-id', features: [readOnlySwitch, socket2] };
    stateManager.setState('device', 'wall-switch', wallSwitch);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      devices: ['wall-switch'],
    });
    assert.calledOnceWithExactly(device.setValue, wallSwitch, socket2, 1);
  });
  it('should only drive the selected switches when the legacy devices are also stored', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      device_features: ['power-strip-socket-1'],
      devices: ['power-strip'],
    });
    assert.calledOnceWithExactly(device.setValue, powerStrip, socket1, 1);
  });
  it('should skip a switch that no longer exists, is read only or is not a switch', async () => {
    stateManager.setState('deviceFeature', 'power-strip-power', {
      ...socket1,
      selector: 'power-strip-power',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
    });
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      device_features: ['deleted-switch', 'power-strip-read-only', 'power-strip-power', 'power-strip-socket-1'],
    });
    assert.calledOnceWithExactly(device.setValue, powerStrip, socket1, 1);
  });
  it('should skip a device that no longer exists', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      devices: ['deleted-device', 'power-strip'],
    });
    assert.calledOnceWithExactly(device.setValue, powerStrip, socket1, 1);
  });
  it('should drive nothing when the action has neither switches nor devices', async () => {
    await sceneManager.executeSingleAction({ type: ACTIONS.SWITCH.TURN_ON });
    assert.notCalled(device.setValue);
  });
  it('should skip a selected switch whose device is not loaded', async () => {
    stateManager.setState('deviceFeature', 'orphan-switch', {
      ...socket1,
      selector: 'orphan-switch',
      device_id: 'unknown-device-id',
    });
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      device_features: ['orphan-switch', 'power-strip-socket-1'],
    });
    assert.calledOnceWithExactly(device.setValue, powerStrip, socket1, 1);
  });
});

describe('scene.executeSingleAction, a value asked by a user which cannot be set', () => {
  const USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
  const lastValueChanged = new Date('2026-01-01T10:00:00.000Z');
  const lampFeature = {
    selector: 'lamp-binary',
    name: 'On/Off',
    device_id: 'device-id-1',
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    last_value: 0,
    last_value_string: null,
    last_value_changed: lastValueChanged,
  };
  const lamp = {
    id: 'device-id-1',
    selector: 'lamp',
    name: 'Living room lamp',
    features: [lampFeature],
  };
  let stateManager;
  let eventFake;
  let device;
  let sceneManager;
  // Executing an action also broadcasts its progress: only the messages sent to one user matter here
  const messagesSentToOneUser = () =>
    eventFake.emit
      .getCalls()
      .filter((call) => call.args[0] === EVENTS.WEBSOCKET.SEND)
      .map((call) => call.args[1]);

  beforeEach(() => {
    stateManager = new StateManager();
    stateManager.setState('device', 'lamp', lamp);
    stateManager.setState('deviceById', 'device-id-1', lamp);
    stateManager.setState('deviceFeature', 'lamp-binary', lampFeature);
    eventFake = { emit: fake.returns(null), on: fake.returns(null) };
    device = { setValue: fake.rejects(new Error('Device unreachable')) };
    sceneManager = new SceneManager(stateManager, eventFake, device);
  });

  it('should tell the user, with the state to go back to (feature selector)', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.DEVICE.SET_VALUE,
      device_feature: 'lamp-binary',
      value: 1,
      user_id: USER_ID,
    });
    assert.calledWith(device.setValue, lamp, lampFeature, 1);
    expect(messagesSentToOneUser()).to.deep.equal([
      {
        type: WEBSOCKET_MESSAGE_TYPES.DEVICE.SET_VALUE_ERROR,
        userId: USER_ID,
        payload: {
          device_feature_selector: 'lamp-binary',
          device_feature_name: 'On/Off',
          device_selector: 'lamp',
          device_name: 'Living room lamp',
          value: 1,
          last_value: 0,
          last_value_string: null,
          last_value_changed: lastValueChanged,
          error: 'Device unreachable',
        },
      },
    ]);
  });

  it('should tell the user, with the state to go back to (device, category and type)', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.DEVICE.SET_VALUE,
      device: 'lamp',
      feature_category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      feature_type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      value: 1,
      user_id: USER_ID,
    });
    expect(messagesSentToOneUser()).to.deep.equal([
      {
        type: WEBSOCKET_MESSAGE_TYPES.DEVICE.SET_VALUE_ERROR,
        userId: USER_ID,
        payload: {
          device_feature_selector: 'lamp-binary',
          device_feature_name: 'On/Off',
          device_selector: 'lamp',
          device_name: 'Living room lamp',
          value: 1,
          last_value: 0,
          last_value_string: null,
          last_value_changed: lastValueChanged,
          error: 'Device unreachable',
        },
      },
    ]);
  });

  it('should tell the user when the error says nothing', async () => {
    device.setValue = fake.rejects(new Error());
    await sceneManager.executeSingleAction({
      type: ACTIONS.DEVICE.SET_VALUE,
      device_feature: 'lamp-binary',
      value: 1,
      user_id: USER_ID,
    });
    expect(messagesSentToOneUser()).to.have.lengthOf(1);
    expect(messagesSentToOneUser()[0].payload).to.deep.include({
      device_feature_selector: 'lamp-binary',
      last_value: 0,
      error: null,
    });
  });

  it('should tell the user when the feature does not exist', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.DEVICE.SET_VALUE,
      device_feature: 'unknown-feature',
      value: 1,
      user_id: USER_ID,
    });
    assert.notCalled(device.setValue);
    expect(messagesSentToOneUser()).to.have.lengthOf(1);
    const [message] = messagesSentToOneUser();
    expect(message.type).to.equal(WEBSOCKET_MESSAGE_TYPES.DEVICE.SET_VALUE_ERROR);
    expect(message.userId).to.equal(USER_ID);
    expect(message.payload).to.deep.include({
      device_feature_selector: 'unknown-feature',
      device_feature_name: null,
      device_selector: null,
      device_name: null,
      value: 1,
      last_value: null,
      last_value_string: null,
      last_value_changed: null,
    });
    expect(message.payload.error).to.be.a('string');
  });

  it('should tell the user when the device does not exist', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.DEVICE.SET_VALUE,
      device: 'unknown-device',
      feature_category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      feature_type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      value: 1,
      user_id: USER_ID,
    });
    assert.notCalled(device.setValue);
    expect(messagesSentToOneUser()).to.have.lengthOf(1);
    const [message] = messagesSentToOneUser();
    expect(message.payload).to.deep.include({
      device_feature_selector: null,
      device_feature_name: null,
      device_selector: 'unknown-device',
      device_name: null,
      last_value: null,
    });
  });

  it('should not tell anyone when the value was not asked by a user', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.DEVICE.SET_VALUE,
      device_feature: 'lamp-binary',
      value: 1,
    });
    assert.calledWith(device.setValue, lamp, lampFeature, 1);
    expect(messagesSentToOneUser()).to.deep.equal([]);
  });

  it('should not tell anyone when another type of action fails', async () => {
    await sceneManager.executeSingleAction({
      type: 'unknown.action',
      user_id: USER_ID,
    });
    expect(messagesSentToOneUser()).to.deep.equal([]);
  });
});
