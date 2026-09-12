const { expect } = require('chai');

const db = require('../../../models');
const passwordUtils = require('../../../utils/password');

const AlarmCode = require('../../../lib/alarm-code');

const JOHN_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('alarmCode.existsActive', () => {
  let alarmCode;
  beforeEach(() => {
    alarmCode = new AlarmCode();
  });

  it('should be false when no code exists', async () => {
    expect(await alarmCode.existsActive()).to.equal(false);
  });

  it('should be true when a code exists', async () => {
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('1234') });
    expect(await alarmCode.existsActive()).to.equal(true);
  });

  it('should be false when the only code has expired', async () => {
    await db.AlarmCode.create({
      name: 'Last week help',
      code: await passwordUtils.hash('4321'),
      valid_until: new Date(Date.now() - 1000),
    });
    expect(await alarmCode.existsActive()).to.equal(false);
  });
});

describe('alarmCode.existsForUser', () => {
  let alarmCode;
  beforeEach(() => {
    alarmCode = new AlarmCode();
  });

  it('should be false when the user has no code', async () => {
    expect(await alarmCode.existsForUser(JOHN_ID)).to.equal(false);
  });

  it('should be true when the user has a code', async () => {
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('1234') });
    expect(await alarmCode.existsForUser(JOHN_ID)).to.equal(true);
  });
});
