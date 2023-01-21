const { fake, assert } = require('sinon');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('scene.send-notification', () => {
  it('should send notification with value injected', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const notification = {
      send: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, notification },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.NOTIFICATION.SEND,
            topic: 'temperature',
            text: 'Temperature in the living room is {{0.0.last_value}} °C.',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(notification.send, 'temperature', 'Temperature in the living room is 15 °C.');
  });
  it('should send notification with value injected', async () => {
    const stateManager = new StateManager(event);
    const http = {
      request: fake.resolves({ result: [15], error: null }),
    };
    const notification = {
      send: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, notification, http },
      [
        [
          {
            type: ACTIONS.HTTP.REQUEST,
            method: 'post',
            url: 'http://test.test',
            body: '{"toto":"toto"}',
            headers: [],
          },
        ],
        [
          {
            type: ACTIONS.NOTIFICATION.SEND,
            topic: 'temperature',
            text: 'Temperature in the living room is {{0.0.result.[0]}} °C.',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(notification.send, 'temperature', 'Temperature in the living room is 15 °C.');
  });
});
