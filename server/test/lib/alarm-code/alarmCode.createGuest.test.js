const { expect, assert } = require('chai');

const db = require('../../../models');
const passwordUtils = require('../../../utils/password');

const AlarmCode = require('../../../lib/alarm-code');

const JOHN_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('alarmCode.createGuest', () => {
  let alarmCode;
  beforeEach(() => {
    alarmCode = new AlarmCode();
  });

  it('should create a guest code with no expiry', async () => {
    const created = await alarmCode.createGuest(JOHN_ID, { name: 'Home help', code: '4321' });

    expect(created).to.have.property('name', 'Home help');
    expect(created).to.have.property('user_id', null);
    expect(created).to.have.property('valid_until', null);
    expect(created).to.not.have.property('code');
    expect(await alarmCode.validate('4321')).to.have.property('name', 'Home help');
  });

  it('should create a guest code valid until a date', async () => {
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const created = await alarmCode.createGuest(JOHN_ID, {
      name: 'Home help',
      code: '4321',
      valid_until: validUntil,
    });

    expect(created.valid_until).to.deep.equal(validUntil);
  });

  it('should refuse a guest code without a name', async () => {
    const promise = alarmCode.createGuest(JOHN_ID, { code: '4321' });
    await assert.isRejected(promise, 'A guest alarm code needs a name');
  });

  it('should refuse a code that is not 4 to 8 digits', async () => {
    const promise = alarmCode.createGuest(JOHN_ID, { name: 'Home help', code: '43' });
    await assert.isRejected(promise, 'An alarm code is 4 to 8 digits');
  });

  it('should refuse a code somebody else uses', async () => {
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('4321') });

    const promise = alarmCode.createGuest(JOHN_ID, { name: 'Home help', code: '4321' });

    await assert.isRejected(promise, 'ALARM_CODE_ALREADY_USED');
  });

  it('should let only one of two concurrent writes take the same code', async () => {
    // A bcrypt hash cannot take a unique index, so writes queue rather than race
    const results = await Promise.allSettled([
      alarmCode.createGuest(JOHN_ID, { name: 'Home help', code: '4321' }),
      alarmCode.createGuest(JOHN_ID, { name: 'Dog sitter', code: '4321' }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).to.have.lengthOf(1);
    expect(results.filter((result) => result.status === 'rejected')).to.have.lengthOf(1);
    expect(await db.AlarmCode.count()).to.equal(1);
  });

  it('should refuse to write once the rate limit is spent', async () => {
    await alarmCode.writeRateLimit.consume(JOHN_ID, 10);

    const promise = alarmCode.createGuest(JOHN_ID, { name: 'Home help', code: '4321' });

    await assert.isRejected(promise, 'TOO_MANY_ALARM_CODE_WRITES');
  });
});
