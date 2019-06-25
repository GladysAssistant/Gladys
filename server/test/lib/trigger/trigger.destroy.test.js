const { expect, assert } = require('chai');
const EventEmitter = require('events');
const { EVENTS } = require('../../../utils/constants');
const StateManager = require('../../../lib/state');
const TriggerManager = require('../../../lib/trigger');

const event = new EventEmitter();

describe('trigger.destroy', () => {
  it('should destroy trigger', async () => {
    const stateManager = new StateManager();
    const triggerManager = new TriggerManager(event, stateManager, {});
    triggerManager.triggerDictionnary[EVENTS.LIGHT.TURNED_ON] = [
      {
        id: '1763b345-b2b6-4c9b-8fed-ae017109956c',
      },
    ];
    await triggerManager.destroy('test-trigger');
    expect(triggerManager.triggerDictionnary[EVENTS.LIGHT.TURNED_ON]).to.deep.equal([]);
  });
  it('should destroy trigger and not remove it from the dictionnary', async () => {
    const stateManager = new StateManager();
    const triggerManager = new TriggerManager(event, stateManager, {});
    await triggerManager.destroy('test-trigger');
    expect(triggerManager.triggerDictionnary[EVENTS.LIGHT.TURNED_ON]).to.be.undefined; // eslint-disable-line
  });
  it('should return not found', async () => {
    const stateManager = new StateManager();
    const triggerManager = new TriggerManager(event, stateManager, {});
    const promise = triggerManager.destroy('not-found-trigger');
    return assert.isRejected(promise, 'Trigger not found');
  });
});
