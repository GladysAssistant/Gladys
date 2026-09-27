const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const StateManager = require('../../../../lib/state');

describe('scene.trigger-panic', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);
  let event;
  let stateManager;

  beforeEach(() => {
    event = new EventEmitter();
    stateManager = new StateManager(event);
  });

  it('should trigger the alarm of the house', async () => {
    const house = {
      panic: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.ALARM.TRIGGER_PANIC,
            house: 'my-house',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.panic, 'my-house');
  });
});
