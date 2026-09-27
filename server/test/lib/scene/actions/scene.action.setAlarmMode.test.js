const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const EventEmitter = require('events');

const { ACTIONS, ALARM_MODES } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const StateManager = require('../../../../lib/state');

describe('scene.set-alarm-mode', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);
  let event;
  let stateManager;

  beforeEach(() => {
    event = new EventEmitter();
    stateManager = new StateManager(event);
  });

  [ALARM_MODES.PRESENCE_ARMED, ALARM_MODES.NIGHT_ARMED, ALARM_MODES.AWAY_ARMED].forEach((alarmMode) => {
    it(`should arm house in mode ${alarmMode}`, async () => {
      const house = {
        getBySelector: fake.resolves({ name: 'my house', alarm_mode: ALARM_MODES.DISARMED }),
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
              alarm_mode: alarmMode,
            },
          ],
        ],
        scope,
      );
      // A scene never waits the delay before arming: that delay exists to let someone walk out.
      assert.calledWith(house.arm, 'my-house', alarmMode, true);
    });
  });

  it('should disarm house', async () => {
    const house = {
      getBySelector: fake.resolves({ name: 'my house', alarm_mode: ALARM_MODES.AWAY_ARMED }),
      disarm: fake.resolves(null),
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
            alarm_mode: ALARM_MODES.DISARMED,
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.disarm, 'my-house');
    assert.notCalled(house.arm);
  });
});
