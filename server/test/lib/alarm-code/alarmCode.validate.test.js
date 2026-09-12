const { expect } = require('chai');

const db = require('../../../models');
const passwordUtils = require('../../../utils/password');

const AlarmCode = require('../../../lib/alarm-code');

const JOHN_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('alarmCode.validate', () => {
  let alarmCode;
  beforeEach(() => {
    alarmCode = new AlarmCode();
  });

  it('should return null when no code exists at all', async () => {
    const match = await alarmCode.validate('1234');
    expect(match).to.equal(null);
  });

  it('should return the code of its holder', async () => {
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('1234') });

    const match = await alarmCode.validate('1234');

    expect(match).to.have.property('user_id', JOHN_ID);
    expect(match.user).to.have.property('selector', 'john');
    expect(match.user).to.have.property('firstname', 'John');
    // The hash never leaves the server, not even internally
    expect(match).to.not.have.property('code');
  });

  it('should return a guest code with its name', async () => {
    await db.AlarmCode.create({ name: 'Home help', code: await passwordUtils.hash('4321') });

    const match = await alarmCode.validate('4321');

    expect(match).to.have.property('name', 'Home help');
    expect(match).to.have.property('user', null);
  });

  it('should return null on a wrong code', async () => {
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('1234') });

    const match = await alarmCode.validate('9999');

    expect(match).to.equal(null);
  });

  it('should ignore an expired code', async () => {
    await db.AlarmCode.create({
      name: 'Last week help',
      code: await passwordUtils.hash('4321'),
      valid_until: new Date(Date.now() - 1000),
    });

    const match = await alarmCode.validate('4321');

    expect(match).to.equal(null);
  });

  it('should find a code among several', async () => {
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('1234') });
    await db.AlarmCode.create({ name: 'Home help', code: await passwordUtils.hash('4321') });

    const match = await alarmCode.validate('4321');

    expect(match).to.have.property('name', 'Home help');
  });
});
