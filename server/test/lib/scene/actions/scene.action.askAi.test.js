const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const EventEmitter = require('events');
const { expect } = require('chai');
const { ACTIONS, MESSAGE_GLADYS_ONLY_SERVICE } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const StateManager = require('../../../../lib/state');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const event = new EventEmitter();

describe('scene.ask-ai', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);
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
      forwardMessageToAiChat: fake.resolves({ answer: 'answer' }),
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
    assert.calledWith(gateway.forwardMessageToAiChat, {
      message: {
        source: 'AI',
        user: {
          id: '7c8db9e1-4f34-4693-a04c-7b1bfc1dbdc4',
          language: 'fr',
          selector: 'pepper',
        },
        language: 'fr',
        text: 'Can you check if the camera in the living room is fine ? Temperature is high (15 °C).',
        // no channel picked on the action: the answer goes to every channel
        service: null,
      },
      image: 'data:image-content',
      context: {},
    });
    expect(scope).to.deep.equal({
      '0': [{ category: 'light', type: 'binary', last_value: 15 }],
      '1': [{ answer: 'answer' }],
    });
  });

  it('should carry the channel chosen on the action down to the reply', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('user', 'pepper', {
      id: '7c8db9e1-4f34-4693-a04c-7b1bfc1dbdc4',
      language: 'fr',
      selector: 'pepper',
    });
    const message = {
      sendToUser: fake.resolves(null),
    };
    const gateway = {
      forwardMessageToAiChat: fake.resolves({ answer: 'answer' }),
    };
    await executeActions(
      { stateManager, event, message, gateway },
      [
        [
          {
            type: ACTIONS.AI.ASK,
            user: 'pepper',
            service: MESSAGE_GLADYS_ONLY_SERVICE,
            text: 'Is the living room too hot?',
          },
        ],
      ],
      {},
    );
    // message.reply reads this property to decide where the answer goes: a
    // scene only storing the answer in a variable must not text the user
    expect(gateway.forwardMessageToAiChat.firstCall.args[0].message).to.have.property(
      'service',
      MESSAGE_GLADYS_ONLY_SERVICE,
    );
  });
});
