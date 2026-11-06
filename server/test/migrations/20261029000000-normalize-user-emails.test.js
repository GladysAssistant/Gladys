const { expect } = require('chai');

const db = require('../../models');

const migration = require('../../migrations/20261029000000-normalize-user-emails');

// raw query: the User model would normalize the email itself
const setEmail = (selector, email) =>
  db.sequelize.query('UPDATE t_user SET email = :email WHERE selector = :selector', {
    replacements: { email, selector },
  });

const getEmails = async () => {
  const users = await db.User.findAll({ attributes: ['selector', 'email'], raw: true });
  return users.reduce((emails, user) => ({ ...emails, [user.selector]: user.email }), {});
};

describe('migration 20261029000000-normalize-user-emails', () => {
  it('should remove the spaces around an email and lower case it', async () => {
    await setEmail('john', ' Demo@Demo.com ');

    await migration.up();

    expect(await getEmails()).to.deep.equal({ john: 'demo@demo.com', pepper: 'pepper@pots.com' });
  });

  it('should leave the emails untouched when they are already normalized', async () => {
    await migration.up();

    expect(await getEmails()).to.deep.equal({ john: 'demo@demo.com', pepper: 'pepper@pots.com' });
  });

  it('should keep an email as it is when another user already has the normalized one', async () => {
    await setEmail('john', 'pepper@pots.com ');

    await migration.up();

    expect(await getEmails()).to.deep.equal({ john: 'pepper@pots.com ', pepper: 'pepper@pots.com' });
  });

  it('should normalize only the first of two emails that normalize to the same one', async () => {
    await setEmail('john', 'shared@gladysassistant.com ');
    await setEmail('pepper', ' shared@gladysassistant.com');

    await migration.up();

    const emails = Object.values(await getEmails()).sort();
    expect(emails).to.have.lengthOf(2);
    expect(emails).to.include('shared@gladysassistant.com');
  });

  it('should be idempotent', async () => {
    await setEmail('pepper', 'Pepper@Pots.com ');

    await migration.up();
    await migration.up();

    expect(await getEmails()).to.deep.equal({ john: 'demo@demo.com', pepper: 'pepper@pots.com' });
  });

  it('should do nothing on an instance without user', async () => {
    await db.User.destroy({ where: {} });

    await migration.up();

    expect(await db.User.count()).to.equal(0);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
