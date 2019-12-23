const { assert, expect } = require('chai');

const EventEmitter = require('events');
const User = require('../../../lib/user');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const stateManager = new StateManager(event);
const Session = require('../../../lib/session');

describe('user.updatePassword', () => {
  const session = new Session('secret');
  const user = new User(session, stateManager);
  it('should update user password', async () => {
    const updatedUser = await user.updatePassword('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'mynewpassword');
    expect(updatedUser).to.deep.equal({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
  });
  it('should update user password and login again', async () => {
    const updatedUser = await user.updatePassword('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'mynewpassword');
    expect(updatedUser).to.deep.equal({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
    await user.login('demo@demo.com', 'mynewpassword');
  });
  it('should return error, password too short', async () => {
    const promise = user.updatePassword('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'short');
    return assert.isRejected(promise, 'Password is too short');
  });
  it('should return error, user not found', async () => {
    const promise = user.updatePassword('949735af-cdc5-4ae3-b756-092d174a4092', 'mynewpasssword');
    return assert.isRejected(promise, 'User not found');
  });
});
