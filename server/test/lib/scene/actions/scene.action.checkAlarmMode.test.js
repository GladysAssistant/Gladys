const { fake } = require('sinon');
const EventEmitter = require('events');
const chaiAssert = require('chai').assert;

const { ACTIONS } = require('../../../../utils/constants');
const { AbortScene } = require('../../../../utils/coreErrors');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

describe('scene.check-alarm-mode', () => {
  let event;
  let stateManager;

  beforeEach(() => {
    event = new EventEmitter();
    stateManager = new StateManager(event);
  });

  it('should abort scene, condition is not verified', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const house = {
      getBySelector: fake.resolves({ name: 'my house', alarm_mode: 'armed' }),
    };
    const scope = {};
    const promise = executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.ALARM.CHECK_ALARM_MODE,
            house: 'my-house',
            alarm_mode: 'disarmed',
          },
        ],
      ],
      scope,
    );
    return chaiAssert.isRejected(promise, AbortScene, 'House "my house" is not in mode disarmed');
  });
  it('should continue scene, condition is verified', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const house = {
      getBySelector: fake.resolves({ name: 'my house', alarm_mode: 'armed' }),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.ALARM.CHECK_ALARM_MODE,
            house: 'my-house',
            alarm_mode: 'armed',
          },
        ],
      ],
      scope,
    );
  });
});
