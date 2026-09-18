const { expect, assert } = require('chai');

const db = require('../../../models');
const passwordUtils = require('../../../utils/password');

const AlarmCode = require('../../../lib/alarm-code');

const JOHN_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const PEPPER_ID = '7a137a56-069e-4996-8816-36558174b727';

describe('alarmCode.setForUser', () => {
  let alarmCode;
  beforeEach(() => {
    alarmCode = new AlarmCode();
  });

  it('should set the code of a user who had none', async () => {
    const created = await alarmCode.setForUser(JOHN_ID, '1234');

    expect(created).to.have.property('id');
    const match = await alarmCode.validate('1234');
    expect(match).to.have.property('user_id', JOHN_ID);
  });

  it('should replace the code of a user who already had one', async () => {
    await alarmCode.setForUser(JOHN_ID, '1234');
    await alarmCode.setForUser(JOHN_ID, '5678');

    // One code per person, and only the new one opens anything
    const codeCount = await db.AlarmCode.count({ where: { user_id: JOHN_ID } });
    expect(codeCount).to.equal(1);
    expect(await alarmCode.validate('1234')).to.equal(null);
    expect(await alarmCode.validate('5678')).to.have.property('user_id', JOHN_ID);
  });

  it('should accept the code a user already had', async () => {
    await alarmCode.setForUser(JOHN_ID, '1234');
    await alarmCode.setForUser(JOHN_ID, '1234');

    expect(await alarmCode.validate('1234')).to.have.property('user_id', JOHN_ID);
  });

  it('should refuse a code somebody else uses, without naming them', async () => {
    await db.AlarmCode.create({ user_id: PEPPER_ID, code: await passwordUtils.hash('1234') });

    const promise = alarmCode.setForUser(JOHN_ID, '1234');

    await assert.isRejected(promise, 'ALARM_CODE_ALREADY_USED');
  });

  it('should accept a code only an expired guest code used', async () => {
    await db.AlarmCode.create({
      name: 'Last week help',
      code: await passwordUtils.hash('1234'),
      valid_until: new Date(Date.now() - 1000),
    });

    await alarmCode.setForUser(JOHN_ID, '1234');

    expect(await alarmCode.validate('1234')).to.have.property('user_id', JOHN_ID);
  });

  it('should refuse a code shorter than 4 digits', async () => {
    const promise = alarmCode.setForUser(JOHN_ID, '123');
    await assert.isRejected(promise, 'An alarm code is 4 to 8 digits');
  });

  it('should refuse a code longer than 8 digits', async () => {
    const promise = alarmCode.setForUser(JOHN_ID, '123456789');
    await assert.isRejected(promise, 'An alarm code is 4 to 8 digits');
  });

  it('should refuse a code that is not only digits', async () => {
    const promise = alarmCode.setForUser(JOHN_ID, '12a4');
    await assert.isRejected(promise, 'An alarm code is 4 to 8 digits');
  });

  it('should refuse a code that is not a string', async () => {
    const promise = alarmCode.setForUser(JOHN_ID, 1234);
    await assert.isRejected(promise, 'An alarm code is 4 to 8 digits');
  });

  it('should return user not found', async () => {
    const promise = alarmCode.setForUser('e5c1d94a-bd8f-4ad4-8dc0-c0e0f6e9f2f4', '1234');
    await assert.isRejected(promise, 'User not found');
  });

  it('should refuse to write once the rate limit is spent', async () => {
    // Answering "this code is taken" is an oracle, so writes are metered
    await alarmCode.writeRateLimit.consume(JOHN_ID, 10);

    const promise = alarmCode.setForUser(JOHN_ID, '1234');

    await assert.isRejected(promise, 'TOO_MANY_ALARM_CODE_WRITES');
  });
});
