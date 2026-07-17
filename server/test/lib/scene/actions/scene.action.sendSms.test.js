const { fake, assert } = require('sinon');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const StateManager = require('../../../../lib/state');

const event = new EventEmitter();
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('scene.send-sms', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);

  it('should send SMS to a specific user with value injected from device get-value', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    stateManager.setState('user', 'john', {
      id: 'user-john',
      selector: 'john',
    });
    const freeMobileService = {
      message: {
        serviceId,
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
            user: 'john',
            text: 'Temperature in the living room is {{0.0.last_value}} °C.',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(freeMobileService.message.send, 'user-john', {
      text: 'Temperature in the living room is 15 °C.',
    });
  });

  it('should send SMS to all configured users when user is "all"', async () => {
    const stateManager = new StateManager(event);
    const freeMobileService = {
      message: {
        serviceId,
        send: fake.resolves(null),
      },
    };
    const service = {
      getService: fake.returns(freeMobileService),
    };
    const variable = {
      getVariables: fake.resolves([
        { user_id: 'user-1', value: 'user1' },
        { user_id: 'user-2', value: 'user2' },
      ]),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, service, variable },
      [
        [
          {
            type: ACTIONS.SMS.SEND,
            user: 'all',
            text: 'Alarm triggered',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(variable.getVariables, 'FREE_MOBILE_USERNAME', serviceId);
    assert.calledWith(freeMobileService.message.send, 'user-1', { text: 'Alarm triggered' });
    assert.calledWith(freeMobileService.message.send, 'user-2', { text: 'Alarm triggered' });
  });

  it('should do nothing if free-mobile service is not available', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: fake.returns(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, service },
      [
        [
          {
            type: ACTIONS.SMS.SEND,
            user: 'all',
            text: 'Alarm triggered',
          },
        ],
      ],
      scope,
    );
  });
});
