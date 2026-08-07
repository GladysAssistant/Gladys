const { expect } = require('chai');
const sinon = require('sinon');

const migration = require('../../migrations/20260629180000-classify-notification-messages');

describe('migration 20260629180000-classify-notification-messages', () => {
  it('should classify proactive notification messages in SQL', async () => {
    const query = sinon.stub().resolves();

    await migration.up({
      sequelize: {
        query,
      },
    });

    expect(query.calledOnce).to.equal(true);
    const sql = query.firstCall.args[0];
    expect(sql).to.include("message_type = 'notification'");
    expect(sql).to.include('%résumé hebdomadaire%');
    expect(sql).to.include('%Gladys has been upgraded%');
    expect(sql).to.include('%community.gladysassistant.com%');
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
