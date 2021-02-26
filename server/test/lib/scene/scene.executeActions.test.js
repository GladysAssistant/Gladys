const { assert, fake } = require('sinon');
const chaiAssert = require('chai').assert;
const { expect } = require('chai');
const EventEmitter = require('events');
const { ACTIONS } = require('../../../utils/constants');
const { AbortScene } = require('../../../utils/coreErrors');
const { executeActions } = require('../../../lib/scene/scene.executeActions');

const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('scene.executeActions', () => {
  it('should execute light turn on', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      {},
    );
    assert.calledOnce(device.setValue);
  });
  it('should execute switch turn on', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.SWITCH.TURN_ON,
            devices: ['switch-1'],
          },
        ],
      ],
      {},
    );
    assert.calledOnce(device.setValue);
  });
  it('should execute wait 5 ms', async () => {
    await executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'milliseconds',
            value: 5,
          },
        ],
      ],
      {},
    );
    await executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'seconds',
            value: 5 / 1000,
          },
        ],
      ],
      {},
    );
    await executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'minutes',
            value: 5 / 1000 / 60,
          },
        ],
      ],
      {},
    );
    await executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'hours',
            value: 5 / 1000 / 60 / 60,
          },
        ],
      ],
      {},
    );
  });
  it('should execute sequential actions', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
        [
          {
            type: ACTIONS.SWITCH.TURN_ON,
            devices: ['switch-1'],
          },
        ],
        [
          {
            type: ACTIONS.SWITCH.TURN_OFF,
            devices: ['switch-1'],
          },
        ],
      ],
      {},
    );
    assert.callCount(device.setValue, 4);
  });
  it('should throw error, action type does not exist', async () => {
    const light = {
      turnOn: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'light-1', light);
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: 'THISDOESNOTEXIST',
            device: 'light-1',
          },
        ],
      ],
      {},
    );
    return chaiAssert.isRejected(promise, 'Action type "THISDOESNOTEXIST" does not exist.');
  });
  it('should execute action device.setValue', async () => {
    const example = {
      stop: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('service', 'example', example);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      device_id: 'device-id',
    });
    stateManager.setState('deviceById', 'device-id', {
      id: 'device-id',
      features: [],
    });
    const device = {
      setValue: fake.resolves(null),
    };
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device_feature: 'my-device-feature',
            value: 11,
          },
        ],
      ],
      {},
    );
    assert.calledWith(
      device.setValue,
      {
        id: 'device-id',
        features: [],
      },
      { device_id: 'device-id' },
      11,
    );
  });
  it('should execute action device.setValue', async () => {
    const example = {
      stop: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('service', 'example', example);
    stateManager.setState('device', 'my-device', {
      id: 'device-id',
      features: [
        {
          category: 'light',
          type: 'binary',
        },
      ],
    });
    const device = {
      setValue: fake.resolves(null),
    };
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device: 'my-device',
            feature_category: 'light',
            feature_type: 'binary',
            value: 1,
          },
        ],
      ],
      {},
    );
    assert.calledWith(
      device.setValue,
      {
        id: 'device-id',
        features: [
          {
            category: 'light',
            type: 'binary',
          },
        ],
      },
      {
        category: 'light',
        type: 'binary',
      },
      1,
    );
  });
  it('should execute action device.getValue', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
      ],
      scope,
    );
    expect(scope).to.deep.equal({
      0: {
        0: {
          category: 'light',
          type: 'binary',
          last_value: 15,
        },
      },
    });
  });
  it('should execute action user.setSeenAtHome', async () => {
    const stateManager = new StateManager(event);
    const house = {
      userSeen: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.USER.SET_SEEN_AT_HOME,
            user: 'john',
            house: 'my-house',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.userSeen, 'my-house', 'john');
  });
  it('should execute action user.setLeftHome', async () => {
    const stateManager = new StateManager(event);
    const house = {
      userLeft: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.USER.SET_OUT_OF_HOME,
            user: 'john',
            house: 'my-house',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.userLeft, 'my-house', 'john');
  });
  it('should execute action user.checkPresence and not call userLeft because user was seen', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device', {
      last_value_changed: Date.now(),
    });
    const house = {
      userSeen: fake.resolves(null),
      userLeft: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.USER.CHECK_PRESENCE,
            user: 'john',
            house: 'my-house',
            minutes: 10,
            device_features: ['my-device'],
          },
        ],
      ],
      scope,
    );
    assert.notCalled(house.userLeft);
  });
  it('should execute action user.checkPresence and call userLeft because user was not seen', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device', {
      last_value_changed: Date.now() - 15 * 60 * 1000,
    });
    const house = {
      userSeen: fake.resolves(null),
      userLeft: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.USER.CHECK_PRESENCE,
            user: 'john',
            house: 'my-house',
            minutes: 10,
            device_features: ['my-device'],
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.userLeft, 'my-house', 'john');
  });
  it('should execute action http.request', async () => {
    const stateManager = new StateManager(event);
    const http = {
      request: fake.resolves({ success: true }),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, http },
      [
        [
          {
            type: ACTIONS.HTTP.REQUEST,
            method: 'post',
            url: 'http://test.test',
            body: '{"toto":"toto"}',
            headers: [
              {
                key: 'authorization',
                value: 'token',
              },
            ],
          },
        ],
      ],
      scope,
    );
    assert.calledWith(http.request, 'post', 'http://test.test', { toto: 'toto' }, { authorization: 'token' });
  });
  it('should execute action http.request with empty body', async () => {
    const stateManager = new StateManager(event);
    const http = {
      request: fake.resolves({ success: true }),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, http },
      [
        [
          {
            type: ACTIONS.HTTP.REQUEST,
            method: 'post',
            url: 'http://test.test',
            headers: [
              {
                key: 'authorization',
                value: 'token',
              },
            ],
          },
        ],
      ],
      scope,
    );
    assert.calledWith(http.request, 'post', 'http://test.test', undefined, { authorization: 'token' });
  });
  it('should abort scene, condition is not verified', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const scope = {};
    const promise = executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
            conditions: [
              {
                variable: '0.0.last_value',
                operator: '=',
                value: 20,
              },
            ],
          },
        ],
      ],
      scope,
    );
    return chaiAssert.isRejected(promise, AbortScene);
  });
  it('should finish scene, condition is verified', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
            conditions: [
              {
                variable: '0.0.last_value',
                operator: '=',
                value: 15,
              },
            ],
          },
        ],
      ],
      scope,
    );
  });
  it('should send message with value injected', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, message },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'pepper',
            text: 'Temperature in the living room is {{0.0.last_value}} °C.',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(message.sendToUser, 'pepper', 'Temperature in the living room is 15 °C.');
  });
});
