const { fake, assert } = require('sinon');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('scene.send-sms', () => {
  it('should send message with value injected from device get-value', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const freeMobileService = {
      sms: {
        send: fake.resolves(null),
      },
    };
    const service = {
      getService: fake.returns(freeMobileService),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, service },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.SMS.SEND,
            text: 'Temperature in the living room is {{0.0.last_value}} °C.',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(freeMobileService.sms.send, 'Temperature in the living room is 15 °C.');
  });

  it('should send message with value injected from http-request', async () => {
    const stateManager = new StateManager(event);
    const http = {
      request: fake.resolves({ result: [15], error: null }),
    };
    const freeMobileService = {
      sms: {
        send: fake.resolves(null),
      },
    };
    const service = {
      getService: fake.returns(freeMobileService),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, service, http },
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
            type: ACTIONS.SMS.SEND,
            text: 'Temperature in the living room is {{0.0.result.[0]}} °C.',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(freeMobileService.sms.send, 'Temperature in the living room is 15 °C.');
  });
});
