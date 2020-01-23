const EventEmitter = require('events');
const { EVENTS, STATES } = require('../../../utils/constants');
const StateManager = require('../../../lib/state');
const TriggerManager = require('../../../lib/trigger');

const event = new EventEmitter();

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
