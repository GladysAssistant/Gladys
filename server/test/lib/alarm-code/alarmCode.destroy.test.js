const { expect, assert } = require('chai');

const db = require('../../../models');
const passwordUtils = require('../../../utils/password');

const AlarmCode = require('../../../lib/alarm-code');

const JOHN_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('alarmCode.destroy', () => {
  let alarmCode;
  beforeEach(() => {
    alarmCode = new AlarmCode();
  });

  it('should revoke a code', async () => {
    const code = await db.AlarmCode.create({ name: 'Home help', code: await passwordUtils.hash('4321') });

    const revoked = await alarmCode.destroy(code.id);

    expect(revoked).to.deep.equal({ id: code.id });
    expect(await alarmCode.validate('4321')).to.equal(null);
  });

  it('should return alarm code not found', async () => {
    const promise = alarmCode.destroy('e5c1d94a-bd8f-4ad4-8dc0-c0e0f6e9f2f4');
    await assert.isRejected(promise, 'Alarm code not found');
  });
});

describe('alarmCode.destroyForUser', () => {
  let alarmCode;
  beforeEach(() => {
    alarmCode = new AlarmCode();
  });

  it('should delete the code of a user', async () => {
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('1234') });

    await alarmCode.destroyForUser(JOHN_ID);

    expect(await alarmCode.existsForUser(JOHN_ID)).to.equal(false);
  });

  it('should not fail when the user had no code', async () => {
    await alarmCode.destroyForUser(JOHN_ID);

    expect(await alarmCode.existsForUser(JOHN_ID)).to.equal(false);
  });
});
