const { expect, assert } = require('chai');

const db = require('../../models');
const passwordUtils = require('../../utils/password');

const JOHN_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('t_alarm_code model', () => {
  it('should never serialize the hash', async () => {
    const code = await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('1234') });

    expect(code.toJSON()).to.not.have.property('code');
    expect(code.toJSON()).to.have.property('user_id', JOHN_ID);
  });

  it('should refuse a code with neither a holder nor a name', async () => {
    // A guest code nobody can tell apart from another in the list
    const promise = db.AlarmCode.create({ code: await passwordUtils.hash('1234') });

    await assert.isRejected(promise, 'A guest alarm code needs a name');
  });
});
