const { fake, assert } = require('sinon');
const EventEmitter = require('events');

const { ACTIONS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('scene.play-notification', () => {
  it('should play notification with injected value', async () => {
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
    assert.calledWith(device.setValue, oneDevice, deviceFeature, 'http://test.com');
  });
});
