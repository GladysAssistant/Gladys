const { expect } = require('chai');
const EventEmitter = require('events');
const StateManager = require('../../../lib/state');
const TriggerManager = require('../../../lib/trigger');

const event = new EventEmitter();

describe('trigger.get', () => {
  it('should search for trigger', async () => {
    const stateManager = new StateManager();
    const triggerManager = new TriggerManager(event, stateManager, {});
    const triggers = await triggerManager.get({
      search: 'Test trigger',
    });
    expect(triggers).to.deep.equal([
      {
        id: '1763b345-b2b6-4c9b-8fed-ae017109956c',
        name: 'Test trigger',
        selector: 'test-trigger',
        type: 'light.turned-on',
        active: true,
        last_triggered: null,
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });
});
