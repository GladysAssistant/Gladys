const { expect } = require('chai');

const db = require('../../models');

const migration = require('../../migrations/20261013000000-restore-missing-administrator');

const getRoles = async () => {
  const users = await db.User.findAll({ attributes: ['selector', 'role'], raw: true });
  return users.reduce((roles, user) => ({ ...roles, [user.selector]: user.role }), {});
};

describe('migration 20261013000000-restore-missing-administrator', () => {
  it('should give the admin role back to the oldest user when there is no administrator', async () => {
    // pepper signed up first, john was added later: pepper owns the instance
    await db.sequelize.query(
      `UPDATE t_user SET role = 'user', created_at = '2020-01-01 00:00:00.000 +00:00' WHERE selector = 'john'`,
    );
    await db.User.update({ role: 'habitant' }, { where: { selector: 'pepper' } });

    await migration.up();

    expect(await getRoles()).to.deep.equal({ john: 'user', pepper: 'admin' });
  });

  it('should leave the roles untouched when an administrator remains', async () => {
    await db.User.update({ role: 'habitant' }, { where: { selector: 'john' } });

    await migration.up();

    expect(await getRoles()).to.deep.equal({ john: 'habitant', pepper: 'admin' });
  });

  it('should do nothing on an instance without user', async () => {
    await db.User.destroy({ where: {} });

    await migration.up();

    expect(await db.User.count()).to.equal(0);
  });

  it('should be idempotent', async () => {
    await db.User.update({ role: 'habitant' }, { where: {} });

    await migration.up();
    await migration.up();

    const adminsCount = await db.User.count({ where: { role: 'admin' } });
    expect(adminsCount).to.equal(1);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
