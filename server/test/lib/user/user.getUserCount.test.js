const { expect } = require('chai');

const User = require('../../../lib/user');
const Session = require('../../../lib/session');
const StateManager = require('../../../lib/state');

describe('user.getUserCount', () => {
  const session = new Session('secret');
  const state = new StateManager();
  const user = new User(session, state);
  it('should return number of users', async () => {
    state.setState('user', 'tony', {});
    const numberOfUser = user.getUserCount();
    expect(numberOfUser).to.equal(1);
  });
});
