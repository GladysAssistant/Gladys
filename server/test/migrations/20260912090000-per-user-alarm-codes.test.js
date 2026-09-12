const { expect } = require('chai');

const db = require('../../models');
const { USER_ROLE } = require('../../utils/constants');

const AlarmCode = require('../../lib/alarm-code');

const migration = require('../../migrations/20260912090000-per-user-alarm-codes');

const JOHN_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const PEPPER_ID = '7a137a56-069e-4996-8816-36558174b727';

const queryInterface = () => db.sequelize.getQueryInterface();

const setHouseCode = (selector, code) =>
  db.sequelize.query(`UPDATE t_house SET alarm_code = :code WHERE selector = :selector`, {
    replacements: { code, selector },
  });

const getHouseCodes = async () => {
  const [houses] = await db.sequelize.query(`SELECT selector, alarm_code FROM t_house`);
  return houses;
};

describe('migration 20260912090000-per-user-alarm-codes', () => {
  it('should do nothing when no house has a code', async () => {
    await migration.migrateHouseCodes(queryInterface());

    expect(await db.AlarmCode.count()).to.equal(0);
  });

  it('should give the code of the house to the first admin, and clear the column', async () => {
    await setHouseCode('test-house', '123456');

    await migration.migrateHouseCodes(queryInterface());

    const codes = await db.AlarmCode.findAll();
    expect(codes).to.have.lengthOf(1);
    expect(codes[0].user_id).to.be.oneOf([JOHN_ID, PEPPER_ID]);
    expect(codes[0].name).to.equal(null);
    expect(codes[0].valid_until).to.equal(null);
    // The code that worked yesterday still works, hashed now
    expect(await new AlarmCode().validate('123456')).to.not.equal(null);
    const houses = await getHouseCodes();
    houses.forEach((house) => expect(house.alarm_code).to.equal(null));
  });

  it('should turn a second, different house code into a guest code named after its house', async () => {
    await setHouseCode('test-house', '123456');
    await setHouseCode('pepper-house', '654321');

    await migration.migrateHouseCodes(queryInterface());

    const codes = await db.AlarmCode.findAll();
    expect(codes).to.have.lengthOf(2);
    const personalCode = codes.find((code) => code.user_id !== null);
    const guestCode = codes.find((code) => code.user_id === null);
    expect(personalCode).to.not.equal(undefined);
    expect(guestCode.name).to.be.oneOf(['Test house', 'Peppers house']);
    const alarmCode = new AlarmCode();
    expect(await alarmCode.validate('123456')).to.not.equal(null);
    expect(await alarmCode.validate('654321')).to.not.equal(null);
  });

  it('should not duplicate a code shared by two houses', async () => {
    await setHouseCode('test-house', '123456');
    await setHouseCode('pepper-house', '123456');

    await migration.migrateHouseCodes(queryInterface());

    expect(await db.AlarmCode.count()).to.equal(1);
  });

  it('should fall back to a guest code when no admin exists', async () => {
    await db.User.update({ role: USER_ROLE.HABITANT }, { where: {} });
    await setHouseCode('test-house', '123456');

    await migration.migrateHouseCodes(queryInterface());

    const codes = await db.AlarmCode.findAll();
    expect(codes).to.have.lengthOf(1);
    expect(codes[0].user_id).to.equal(null);
    expect(codes[0].name).to.equal('Test house');
  });

  it('should be safe to run twice', async () => {
    await setHouseCode('test-house', '123456');

    await migration.migrateHouseCodes(queryInterface());
    await migration.migrateHouseCodes(queryInterface());

    expect(await db.AlarmCode.count()).to.equal(1);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
