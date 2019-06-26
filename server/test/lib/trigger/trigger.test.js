const { expect } = require('chai');
const EventEmitter = require('events');
const { EVENTS, STATES, CONDITIONS } = require('../../../utils/constants');
const StateManager = require('../../../lib/state');
const TriggerManager = require('../../../lib/trigger');
const { verifyTrigger } = require('../../../lib/trigger/trigger.verifyTrigger');

const event = new EventEmitter();

describe('trigger.verifyTrigger', () => {
  it('should return condition true', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('house', 'main-house', {
      alarm: STATES.HOUSE_ALARM.ARMED,
    });
    const result = verifyTrigger(
      stateManager,
      EVENTS.LIGHT.TURNED_ON,
      {
        conditions: [
          {
            type: CONDITIONS.HOUSE_ALARM.IS_ARMED,
            house: 'main-house',
          },
        ],
      },
      {},
    );
    expect(result).to.be.true; // eslint-disable-line
  });
  it('should return condition true', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('house', 'main-house', {
      alarm: STATES.HOUSE_ALARM.ARMED,
    });
    const result = verifyTrigger(
      stateManager,
      EVENTS.LIGHT.TURNED_ON,
      {
        conditions: [
          {
            type: CONDITIONS.HOUSE_ALARM.IS_DISARMED,
            house: 'main-house',
            or: [
              {
                type: CONDITIONS.HOUSE_ALARM.IS_ARMED,
                house: 'main-house',
              },
            ],
          },
        ],
      },
      {},
    );
    expect(result).to.be.true; // eslint-disable-line
  });
  it('should return condition false', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('house', 'main-house', {
      alarm: STATES.HOUSE_ALARM.DISARMED,
    });
    const result = verifyTrigger(
      stateManager,
      EVENTS.LIGHT.TURNED_ON,
      {
        conditions: [
          {
            type: CONDITIONS.HOUSE_ALARM.IS_ARMED,
            house: 'main-house',
          },
        ],
      },
      {},
    );
    expect(result).to.be.false; // eslint-disable-line
  });
});

describe('triggerManager.handleEvent', () => {
  it('should handle new event without any trigger', async () => {
    const stateManager = new StateManager(event);
    const triggerManager = new TriggerManager(event, stateManager, {});
    stateManager.setState('house', 'main-house', {
      alarm: STATES.HOUSE_ALARM.ARMED,
    });
    triggerManager.handleEvent(EVENTS.HOUSE_ALARM.ARMED, {});
  });
  it('should handle new event with a trigger', async () => {
    const stateManager = new StateManager(event);
    const triggerManager = new TriggerManager(event, stateManager, {});
    triggerManager.addToListeners({
      id: 1,
      type: EVENTS.HOUSE_ALARM.ARMED,
      conditions: [],
      scenes: [],
    });
    stateManager.setState('house', 'main-house', {
      alarm: STATES.HOUSE_ALARM.ARMED,
    });
    triggerManager.handleEvent(EVENTS.HOUSE_ALARM.ARMED, {});
  });
});
