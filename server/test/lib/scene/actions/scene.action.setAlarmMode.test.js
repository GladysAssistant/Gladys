const { fake, assert } = require('sinon');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

describe('scene.set-alarm-mode', () => {
  let event;
  let stateManager;

  beforeEach(() => {
    event = new EventEmitter();
    stateManager = new StateManager(event);
  });

  it('should arm house', async () => {
    const house = {
      getBySelector: fake.resolves({ name: 'my house', alarm_mode: 'disarmed' }),
      arm: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.ALARM.SET_ALARM_MODE,
            house: 'my-house',
            alarm_mode: 'armed',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.arm, 'my-house', true);
  });
  it('should disarm house', async () => {
    const house = {
      getBySelector: fake.resolves({ name: 'my house', alarm_mode: 'armed' }),
      disarm: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.ALARM.SET_ALARM_MODE,
            house: 'my-house',
            alarm_mode: 'disarmed',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.disarm, 'my-house');
  });
  it('should partially arm house', async () => {
    const house = {
      getBySelector: fake.resolves({ name: 'my house', alarm_mode: 'disarmed' }),
      partialArm: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.ALARM.SET_ALARM_MODE,
            house: 'my-house',
            alarm_mode: 'partially-armed',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.partialArm, 'my-house');
  });
  it('should put house in panic mode', async () => {
    const house = {
      getBySelector: fake.resolves({ name: 'my house', alarm_mode: 'disarmed' }),
      panic: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.ALARM.SET_ALARM_MODE,
            house: 'my-house',
            alarm_mode: 'panic',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.panic, 'my-house');
  });
});
