const { expect, assert } = require('chai');
const EventEmitter = require('events');
const StateManager = require('../../../lib/state');
const TriggerManager = require('../../../lib/trigger');

const event = new EventEmitter();

describe('trigger.update', () => {
  it('should update trigger', async () => {
    const stateManager = new StateManager();
    const triggerManager = new TriggerManager(event, stateManager, {});
    const updatedTrigger = await triggerManager.update('test-trigger', {
      name: 'Updated trigger',
    });
    expect(updatedTrigger).to.have.property('name', 'Updated trigger');
  });
  it('should return not found', async () => {
    const stateManager = new StateManager();
    const triggerManager = new TriggerManager(event, stateManager, {});
    const promise = triggerManager.update('not-found-trigger', {
      name: 'My trigger',
    });
    return assert.isRejected(promise);
  });
});
