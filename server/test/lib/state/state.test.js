const { expect } = require('chai');
const EventEmitter = require('events');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('state', () => {
  it('should set house state', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('house', 'main-house', {
      alarm: 'disarmed',
    });
  });
  it('should set user state', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('user', 'tony', {
      sleep: 'asleep',
    });
  });
  it('should update user state', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('user', 'tony', {
      sleep: 'asleep',
    });
    stateManager.setState('user', 'tony', {
      sleep: 'awake',
    });
  });
  it('should get user state', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('user', 'tony', {
      sleep: 'asleep',
    });
    const userSleepState = stateManager.getKey('user', 'tony', 'sleep');
    expect(userSleepState).to.equal('asleep');
  });
  it('should get all users keys', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('user', 'tony', {
      sleep: 'asleep',
    });
    const keys = stateManager.getAllKeys('user');
    expect(keys).to.deep.equal(['tony']);
  });
  it('should return null', async () => {
    const stateManager = new StateManager(event);
    const userSleepState = stateManager.getKey('user', 'tony', 'sleep');
    expect(userSleepState).to.be.null; // eslint-disable-line
  });
});
