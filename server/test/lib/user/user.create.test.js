const { expect, assert } = require('chai');
const EventEmitter = require('events');
const User = require('../../../lib/user');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const variable = {
  getValue: () => Promise.resolve(null),
  setValue: () => Promise.resolve(null),
};

const stateManager = new StateManager(event);

describe('user.create', () => {
  const user = new User({}, stateManager, variable);
  it('should create user', async () => {
    const createdUser = await user.create({
      firstname: 'Tony',
      lastname: 'Stark',
      email: 'tony.stark@gladysassistant.com',
      password: 'testststs',
      birthdate: '01/01/2019',
      language: 'en',
      role: 'admin',
    });
    expect(createdUser).not.to.have.property('password');
  });
  it('should create user and login with the same email/password', async () => {
    await user.create({
      firstname: 'Tony',
      lastname: 'Stark',
      email: 'tony.stark@gladysassistant.com',
      password: 'testststs',
      birthdate: '01/01/2019',
      language: 'en',
      role: 'admin',
    });
    await user.login('tony.stark@gladysassistant.com', 'testststs');
  });
  it('should not create user, wrong email', async () => {
    const promise = user.create({
      firstname: 'Tony',
      lastname: 'Stark',
      email: 'thisisnotemail',
      password: 'testststs',
      birthdate: '01/01/2019',
      language: 'en',
      role: 'admin',
    });
    return assert.isRejected(promise, 'Validation error: Validation isEmail on email failed');
  });
  it('should not create user, password too small', () => {
    const promise = user.create({
      firstname: 'Tony',
      lastname: 'Stark',
      email: 'tony.stark@gladysassistant.com',
      password: 'low',
      birthdate: '01/01/2019',
      language: 'en',
      role: 'admin',
    });
    return assert.isRejected(promise, 'Password is too short');
  });
});
