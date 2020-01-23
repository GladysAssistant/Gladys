const { expect } = require('chai');
const EventEmitter = require('events');
const StateManager = require('../../../lib/state');
const TriggerManager = require('../../../lib/trigger');

const event = new EventEmitter();

describe('trigger.init', () => {
  it('should init triggers with init', async () => {
    const stateManager = new StateManager();
    const triggerManager = new TriggerManager(event, stateManager, {});
    const triggers = await triggerManager.init();
    expect(triggers).to.be.instanceOf(Array);
    triggers.forEach((trigger) => {
      expect(trigger).to.have.property('type');
    });
  });
});
