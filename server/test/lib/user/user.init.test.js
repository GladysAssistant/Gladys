const { expect } = require('chai');

const db = require('../../../models');
const User = require('../../../lib/user');
const Session = require('../../../lib/session');
const StateManager = require('../../../lib/state');

describe('user.init', () => {
  it('should load users from database and put them in state', async () => {
    const stateManager = new StateManager();
    const user = new User(new Session('secret'), stateManager);
    const users = await user.init();
    expect(users.length).to.be.above(0);
    expect(user.getUserCount()).to.equal(users.length);
  });
  it('should delete the temporary account left by an aborted Gladys Plus restore during signup', async () => {
    await db.User.destroy({ where: {} });
    await db.User.create({
      firstname: 'temp-user',
      lastname: 'temp-user',
      selector: 'temp-user',
      email: 'temp-user@test.fr',
      password: 'temp-password',
      role: 'admin',
      language: 'en',
      birthdate: '1990-12-12',
    });
    const stateManager = new StateManager();
    const user = new User(new Session('secret'), stateManager);
    const users = await user.init();
    expect(users).to.deep.equal([]);
    expect(user.getUserCount()).to.equal(0);
    const usersInDb = await db.User.findAll();
    expect(usersInDb).to.have.lengthOf(0);
  });
  it('should not delete a legitimate single user', async () => {
    await db.User.destroy({ where: {} });
    await db.User.create({
      firstname: 'Tony',
      lastname: 'Stark',
      selector: 'tony',
      email: 'tony.stark@gladysassistant.com',
      password: 'mysuperpassword',
      role: 'admin',
      language: 'en',
      birthdate: '1990-12-12',
    });
    const stateManager = new StateManager();
    const user = new User(new Session('secret'), stateManager);
    const users = await user.init();
    expect(users).to.have.lengthOf(1);
    expect(users[0].email).to.equal('tony.stark@gladysassistant.com');
    const usersInDb = await db.User.findAll();
    expect(usersInDb).to.have.lengthOf(1);
  });
});
