const { assert } = require('chai');

const EventEmitter = require('events');
const User = require('../../../lib/user');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const stateManager = new StateManager(event);
const Session = require('../../../lib/session');

describe('user.destroy', () => {
  const session = new Session('secret');
  const user = new User(session, stateManager);
  it('should destroy user, then return not found', async () => {
    await user.destroy('pepper');
    const promise = user.getBySelector('pepper');
    return assert.isRejected(promise, 'User not found');
  });
  it('should destroy return not found', async () => {
    const promise = user.destroy('USER_NOT_FOUND');
    return assert.isRejected(promise, 'User not found');
  });
});
