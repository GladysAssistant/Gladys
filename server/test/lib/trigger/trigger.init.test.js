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
      expect(trigger).to.have.property('id');
      expect(trigger).to.have.property('name');
      expect(trigger).to.have.property('selector');
      expect(trigger).to.have.property('type');
      expect(trigger).to.have.property('active');
      expect(trigger).to.have.property('rule');
      expect(trigger).to.have.property('last_triggered');
      expect(trigger).to.have.property('scenes');
      expect(trigger.scenes).to.be.instanceOf(Array);
      trigger.scenes.forEach((scene) => {
        expect(scene).to.have.property('id');
        expect(scene).to.have.property('name');
        expect(scene).to.have.property('selector');
        expect(scene).to.have.property('actions');
        expect(scene.actions).to.be.instanceOf(Array);
        scene.actions.forEach((parallelActions) => {
          expect(parallelActions).to.be.instanceOf(Array);
          parallelActions.forEach((action) => {
            expect(action).to.have.property('type');
          });
        });
      });
    });
  });
});
