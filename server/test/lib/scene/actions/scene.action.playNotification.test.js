const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const EventEmitter = require('events');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { ACTIONS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const { AbortScene } = require('../../../../utils/coreErrors');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const StateManager = require('../../../../lib/state');

chai.use(chaiAsPromised);

const event = new EventEmitter();

describe('scene.play-notification', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);

  /**
   * @description Build the mocks needed to execute a "play notification" action.
   * @returns {object} The state manager, the device mock, the gateway mock and the device feature.
   * @example const { stateManager, device } = buildScene();
   */
  function buildScene() {
    const stateManager = new StateManager(event);
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.MUSIC,
      type: DEVICE_FEATURE_TYPES.MUSIC.PLAY_NOTIFICATION,
      last_value: 15,
    };
    const oneDevice = {
      features: [deviceFeature],
    };
    stateManager.setState('deviceFeature', 'my-device-feature', deviceFeature);
    stateManager.setState('device', 'my-device', oneDevice);
    const message = {
      sendToUser: fake.resolves(null),
    };
    const gateway = {
      getTTSApiUrl: fake.resolves({ url: 'http://test.com' }),
    };
    const device = {
      setValue: fake.resolves(null),
    };
    return { stateManager, oneDevice, deviceFeature, message, gateway, device };
  }

  it('should play notification with injected value', async () => {
    const { stateManager, oneDevice, deviceFeature, message, gateway, device } = buildScene();
    const scope = {};
    await executeActions(
      { stateManager, event, message, gateway, device },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.MUSIC.PLAY_NOTIFICATION,
            device: 'my-device',
            text: 'Temperature in the living room is {{0.0.last_value}} °C.',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(gateway.getTTSApiUrl, { text: 'Temperature in the living room is 15 °C.' });
    // No volume in the action: the speaker service will use its own default
    assert.calledWith(device.setValue, oneDevice, deviceFeature, 'http://test.com', { volume: undefined });
  });

  it('should play notification with a fixed volume', async () => {
    const { stateManager, oneDevice, deviceFeature, message, gateway, device } = buildScene();
    await executeActions(
      { stateManager, event, message, gateway, device },
      [
        [
          {
            type: ACTIONS.MUSIC.PLAY_NOTIFICATION,
            device: 'my-device',
            text: 'Hello',
            volume: 40,
          },
        ],
      ],
      {},
    );
    assert.calledWith(device.setValue, oneDevice, deviceFeature, 'http://test.com', { volume: 40 });
  });

  it('should play notification with a calculated volume', async () => {
    const { stateManager, oneDevice, deviceFeature, message, gateway, device } = buildScene();
    await executeActions(
      { stateManager, event, message, gateway, device },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.MUSIC.PLAY_NOTIFICATION,
            device: 'my-device',
            text: 'Hello',
            evaluate_volume: '{{0.0.last_value}} + 5.4',
          },
        ],
      ],
      {},
    );
    assert.calledWith(device.setValue, oneDevice, deviceFeature, 'http://test.com', { volume: 20 });
  });

  it('should play notification with a calculated volume clamped to 100', async () => {
    const { stateManager, oneDevice, deviceFeature, message, gateway, device } = buildScene();
    await executeActions(
      { stateManager, event, message, gateway, device },
      [
        [
          {
            type: ACTIONS.MUSIC.PLAY_NOTIFICATION,
            device: 'my-device',
            text: 'Hello',
            evaluate_volume: '120',
          },
        ],
      ],
      {},
    );
    assert.calledWith(device.setValue, oneDevice, deviceFeature, 'http://test.com', { volume: 100 });
  });

  it('should play notification with a calculated volume clamped to 0', async () => {
    const { stateManager, oneDevice, deviceFeature, message, gateway, device } = buildScene();
    await executeActions(
      { stateManager, event, message, gateway, device },
      [
        [
          {
            type: ACTIONS.MUSIC.PLAY_NOTIFICATION,
            device: 'my-device',
            text: 'Hello',
            evaluate_volume: '10 - 30',
          },
        ],
      ],
      {},
    );
    assert.calledWith(device.setValue, oneDevice, deviceFeature, 'http://test.com', { volume: 0 });
  });

  it('should throw an error when evaluate_volume is not a valid formula', async () => {
    const { stateManager, message, gateway, device } = buildScene();
    const actionPromise = executeActions(
      { stateManager, event, message, gateway, device },
      [
        [
          {
            type: ACTIONS.MUSIC.PLAY_NOTIFICATION,
            device: 'my-device',
            text: 'Hello',
            evaluate_volume: 'not_a_number',
          },
        ],
      ],
      {},
    );

    await chai.assert.isRejected(actionPromise, AbortScene, 'ACTION_VALUE_NOT_A_NUMBER');
    assert.notCalled(device.setValue);
  });

  it('should throw an error when evaluate_volume does not return a finite number', async () => {
    const { stateManager, message, gateway, device } = buildScene();
    const actionPromise = executeActions(
      { stateManager, event, message, gateway, device },
      [
        [
          {
            type: ACTIONS.MUSIC.PLAY_NOTIFICATION,
            device: 'my-device',
            text: 'Hello',
            evaluate_volume: '50 / 0',
          },
        ],
      ],
      {},
    );

    await chai.assert.isRejected(actionPromise, AbortScene, 'ACTION_VALUE_NOT_A_NUMBER');
    assert.notCalled(device.setValue);
  });
});
