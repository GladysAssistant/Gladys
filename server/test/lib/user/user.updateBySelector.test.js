const { assert, expect } = require('chai');

const EventEmitter = require('events');
const db = require('../../../models');
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
  it('should remove the admin role when another administrator remains', async () => {
    const updatedUser = await user.updateBySelector('pepper', {
      role: 'habitant',
    });
    expect(updatedUser).to.have.property('role', 'habitant');
    const john = await db.User.findOne({ where: { selector: 'john' } });
    expect(john).to.have.property('role', 'admin');
  });
  it('should return error, the last administrator cannot lose the admin role', async () => {
    await db.User.update({ role: 'habitant' }, { where: { selector: 'john' } });
    const promise = user.updateBySelector('pepper', {
      role: 'user',
    });
    await assert.isRejected(promise, 'The last administrator of the instance cannot lose the admin role');
    const pepper = await db.User.findOne({ where: { selector: 'pepper' } });
    expect(pepper).to.have.property('role', 'admin');
  });
  it('should update the last administrator when the admin role is kept', async () => {
    await db.User.update({ role: 'habitant' }, { where: { selector: 'john' } });
    const updatedUser = await user.updateBySelector('pepper', {
      firstname: 'Virginia',
      role: 'admin',
    });
    expect(updatedUser).to.have.property('firstname', 'Virginia');
    expect(updatedUser).to.have.property('role', 'admin');
  });
  it('should give the admin role back to a user when there is no administrator', async () => {
    await db.User.update({ role: 'habitant' }, { where: {} });
    const updatedUser = await user.updateBySelector('pepper', {
      role: 'admin',
    });
    expect(updatedUser).to.have.property('role', 'admin');
  });
  it('should return error, user not found', async () => {
    const promise = user.updateBySelector('USER_NOT_FOUND', {
      picture: tooLongImage.picture,
    });
    return assert.isRejected(promise, 'User not found');
  });
});
