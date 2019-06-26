const { assert, fake } = require('sinon');
const chaiAssert = require('chai').assert;
const EventEmitter = require('events');
const { ACTIONS } = require('../../../utils/constants');
const { executeActions } = require('../../../lib/scene/scene.executeActions');

const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('scene.executeActions', () => {
  it('should execute light turn on', async () => {
    const light = {
      turnOn: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'light-1', light);
    await executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            device: 'light-1',
          },
        ],
      ],
      {},
    );
    assert.calledOnce(light.turnOn);
  });
  it('should execute wait 5 ms', async () => {
    await executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            milliseconds: 5,
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
            seconds: 5 / 1000,
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
            minutes: 5 / 1000 / 60,
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
            hours: 5 / 1000 / 60 / 60,
          },
        ],
      ],
      {},
    );
  });
  it('should execute start service', async () => {
    const example = {
      start: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('service', 'example', example);
    await executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.SERVICE.START,
            service: 'example',
          },
        ],
      ],
      {},
    );
    assert.calledOnce(example.start);
  });
  it('should execute stop service', async () => {
    const example = {
      stop: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('service', 'example', example);
    await executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.SERVICE.STOP,
            service: 'example',
          },
        ],
      ],
      {},
    );
    assert.calledOnce(example.stop);
  });
  it('should execute sequential actions', async () => {
    const light = {
      turnOn: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'light-1', light);
    await executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            device: 'light-1',
          },
        ],
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            device: 'light-1',
          },
        ],
      ],
      {},
    );
    assert.calledTwice(light.turnOn);
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
});
