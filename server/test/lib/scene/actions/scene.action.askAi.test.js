const { fake, assert } = require('sinon');
const EventEmitter = require('events');
const { ACTIONS } = require('../../../../utils/constants');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('scene.ask-ai', () => {
  it('should ask AI about a camera image then send answer to user', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    stateManager.setState('user', 'pepper', {
      id: '7c8db9e1-4f34-4693-a04c-7b1bfc1dbdc4',
      language: 'fr',
      selector: 'pepper',
    });
    const message = {
      sendToUser: fake.resolves(null),
    };
    const device = {
      camera: {
        getLiveImage: fake.resolves('image-content'),
      },
    };
    const gateway = {
      forwardMessageToOpenAI: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, message, device, gateway },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.AI.ASK,
            user: 'pepper',
            camera: 'my-camera',
            text:
              'Can you check if the camera in the living room is fine ? Temperature is high ({{0.0.last_value}} °C).',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(gateway.forwardMessageToOpenAI, {
      message: {
        source: 'AI',
        user: {
          id: '7c8db9e1-4f34-4693-a04c-7b1bfc1dbdc4',
          language: 'fr',
          selector: 'pepper',
        },
        language: 'fr',
        text: 'Can you check if the camera in the living room is fine ? Temperature is high (15 °C).',
      },
      image: 'data:image-content',
      context: {},
    });
  });
});
