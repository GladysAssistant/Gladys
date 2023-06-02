const { fake, assert } = require('sinon');
const EventEmitter = require('events');
const { ACTIONS } = require('../../../../utils/constants');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('scene.send-camera-message', () => {
  it('should send message with camera image and value injected', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const message = {
      sendToUser: fake.resolves(null),
    };
    const device = {
      camera: {
        getLiveImage: fake.resolves('image-content'),
      },
    };
    const scope = {};
    await executeActions(
      { stateManager, event, message, device },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.MESSAGE.SEND_CAMERA,
            user: 'pepper',
            text: 'Temperature in the living room is {{0.0.last_value}} °C.',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(message.sendToUser, 'pepper', 'Temperature in the living room is 15 °C.', 'image-content');
  });
});
