const { expect, assert } = require('chai');
const EventEmitter = require('events');
const { EVENTS, CONDITIONS } = require('../../../utils/constants');
const StateManager = require('../../../lib/state');
const TriggerManager = require('../../../lib/trigger');

const event = new EventEmitter();

describe('trigger.create', () => {
  it('should create trigger', async () => {
    const stateManager = new StateManager();
    const triggerManager = new TriggerManager(event, stateManager, {});
    const createdTrigger = await triggerManager.create({
      name: 'My trigger',
      type: EVENTS.LIGHT.TURNED_ON,
      rule: {
        conditions: [
          {
            type: CONDITIONS.HOUSE_ALARM.IS_ARMED,
            house: 'my-house',
          },
        ],
      },
    });
    expect(createdTrigger).to.deep.equal({
      id: createdTrigger.id,
      active: true,
      name: 'My trigger',
      type: EVENTS.LIGHT.TURNED_ON,
      rule: {
        conditions: [
          {
            type: CONDITIONS.HOUSE_ALARM.IS_ARMED,
            house: 'my-house',
          },
        ],
      },
      updated_at: createdTrigger.updated_at,
      created_at: createdTrigger.created_at,
      selector: 'my-trigger',
    });
  });
  it('should not create invalid trigger', async () => {
    const stateManager = new StateManager();
    const triggerManager = new TriggerManager(event, stateManager, {});
    const promise = triggerManager.create({
      name: 'My trigger',
      type: EVENTS.LIGHT.TURNED_ON,
      rule: {
        conditions: [
          {
            type: 'UNKOWN',
            house: 'my-house',
          },
        ],
      },
    });
    assert.isRejected(promise);
  });
});
