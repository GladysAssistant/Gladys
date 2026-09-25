const { expect } = require('chai');

const db = require('../../../models');
const passwordUtils = require('../../../utils/password');

const AlarmCode = require('../../../lib/alarm-code');

const JOHN_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('alarmCode.get', () => {
  let alarmCode;
  beforeEach(() => {
    alarmCode = new AlarmCode();
  });

  it('should return an empty list when no code exists', async () => {
    const codes = await alarmCode.get();
    expect(codes).to.deep.equal([]);
  });

  it('should list the codes with their holder and never a hash', async () => {
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('1234') });
    await db.AlarmCode.create({ name: 'Home help', code: await passwordUtils.hash('4321') });

    const codes = await alarmCode.get();

    expect(codes).to.have.lengthOf(2);
    codes.forEach((code) => {
      expect(code).to.not.have.property('code');
    });
    const personalCode = codes.find((code) => code.user_id === JOHN_ID);
    expect(personalCode.user).to.have.property('firstname', 'John');
    expect(personalCode.user).to.not.have.property('password');
    const guestCode = codes.find((code) => code.user_id === null);
    expect(guestCode).to.have.property('name', 'Home help');
    expect(guestCode).to.have.property('user', null);
  });
});
