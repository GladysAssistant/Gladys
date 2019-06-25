const { assert, expect } = require('chai');

const EventEmitter = require('events');
const User = require('../../../lib/user');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const stateManager = new StateManager(event);
const Session = require('../../../lib/session');

const tooLongImage = require('./tooLongImage.json');

describe('user.update', () => {
  const session = new Session('secret');
  const user = new User(session, stateManager);
  it('should update user', async () => {
    const updatedUser = await user.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      picture: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA',
    });
    expect(updatedUser).to.deep.equal({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
  });
  it('should return error, picture too long', async () => {
    const promise = user.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      picture: tooLongImage.picture,
    });
    return assert.isRejected(promise, 'Validation error: Profile picture too big');
  });
  it('should return error, user not found', async () => {
    const promise = user.update('949735af-cdc5-4ae3-b756-092d174a4092', {});
    return assert.isRejected(promise, 'User not found');
  });
});
