const { expect, assert } = require('chai');

const db = require('../../models');

const AlarmCode = require('../../lib/alarm-code');

const migration = require('../../migrations/20260912090000-per-user-alarm-codes');

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

  it('should turn the code of a house into a guest code named after it, and clear the column', async () => {
    await setHouseCode('test-house', '123456');

    await migration.migrateHouseCodes(queryInterface());

    const codes = await db.AlarmCode.findAll();
    expect(codes).to.have.lengthOf(1);
    // A house code was shared by the household: it belongs to nobody in particular
    expect(codes[0].user_id).to.equal(null);
    expect(codes[0].name).to.equal('Test house');
    expect(codes[0].valid_until).to.equal(null);
    // The code that worked yesterday still works, hashed now
    expect(await new AlarmCode().validate('123456')).to.not.equal(null);
    const houses = await getHouseCodes();
    houses.forEach((house) => expect(house.alarm_code).to.equal(null));
  });

  it('should migrate the code of every house', async () => {
    await setHouseCode('test-house', '123456');
    await setHouseCode('pepper-house', '654321');

    await migration.migrateHouseCodes(queryInterface());

    const codes = await db.AlarmCode.findAll({ order: [['name', 'ASC']] });
    expect(codes.map((code) => code.name)).to.deep.equal(['Peppers house', 'Test house']);
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

  it('should be safe to run twice', async () => {
    await setHouseCode('test-house', '123456');

    await migration.migrateHouseCodes(queryInterface());
    await migration.migrateHouseCodes(queryInterface());

    expect(await db.AlarmCode.count()).to.equal(1);
  });

  it('should leave nothing behind when its transaction is rolled back', async () => {
    await setHouseCode('test-house', '123456');

    // An instance interrupted midway comes back with its house codes intact, rather than with half
    // the codes migrated and an index that refuses the retry
    const interrupted = db.sequelize.transaction(async (transaction) => {
      await migration.migrateHouseCodes(queryInterface(), transaction);
      throw new Error('interrupted');
    });
    await assert.isRejected(interrupted, 'interrupted');

    expect(await db.AlarmCode.count()).to.equal(0);
    const houses = await getHouseCodes();
    expect(houses.filter((house) => house.alarm_code === '123456')).to.have.lengthOf(1);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
