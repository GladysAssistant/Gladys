const { assert, expect } = require('chai');

const EventEmitter = require('events');
const User = require('../../../lib/user');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const stateManager = new StateManager(event);
const Session = require('../../../lib/session');

const tooLongImage = require('./tooLongImage.json');

describe('user.updateBySelector', () => {
  const session = new Session('secret');
  const user = new User(session, stateManager);
  it('should update user', async () => {
    const updatedUser = await user.updateBySelector('pepper', {
      picture: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA',
    });
    expect(updatedUser).to.deep.equal({
      id: '7a137a56-069e-4996-8816-36558174b727',
      firstname: 'Pepper',
      lastname: 'Pots',
      selector: 'pepper',
      email: 'pepper@pots.com',
      birthdate: '12/12/1990',
      language: 'en',
      picture: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA',
      role: 'admin',
      temperature_unit_preference: 'celsius',
      distance_unit_preference: 'metric',
      last_latitude: null,
      last_longitude: null,
      last_altitude: null,
      last_accuracy: null,
      last_location_changed: null,
      current_house_id: '6295ad8b-b655-4422-9e6d-b4612da5d55f',
      last_house_changed: new Date('2019-02-12T07:49:07.556Z'),
      created_at: new Date('2019-02-12T07:49:07.556Z'),
      updated_at: updatedUser.updated_at,
    });
  });
  it('should update user password', async () => {
    const updatedUser = await user.updateBySelector('pepper', {
      password: 'mybigpassword',
    });
    await user.login(updatedUser.email, 'mybigpassword');
  });
  it('should return error, password too short', async () => {
    const promise = user.updateBySelector('pepper', {
      password: 'test12',
    });
    return assert.isRejected(promise, 'Password is too short');
  });
  it('should return error, picture too long', async () => {
    const promise = user.updateBySelector('pepper', {
      picture: tooLongImage.picture,
    });
    return assert.isRejected(promise, 'Validation error: Profile picture too big');
  });
  it('should return error, user not found', async () => {
    const promise = user.updateBySelector('USER_NOT_FOUND', {
      picture: tooLongImage.picture,
    });
    return assert.isRejected(promise, 'User not found');
  });
});
