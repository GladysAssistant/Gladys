const { expect } = require('chai');

const db = require('../../models');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

const migration = require('../../migrations/20260921000000-clear-gladys-plus-payment-lock');

const getLock = () =>
  db.Variable.findOne({
    where: { name: SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE },
  });

describe('migration 20260921000000-clear-gladys-plus-payment-lock', () => {
  it('should clear the Gladys Plus payment lock', async () => {
    await db.Variable.create({
      name: SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE,
      value: '2026-09-10T02:00:00.000Z',
    });

    await migration.up();

    expect(await getLock()).to.equal(null);
  });

  it('should leave the other gateway variables untouched', async () => {
    await migration.up();

    const rsaPublicKey = await db.Variable.findOne({ where: { name: 'GLADYS_GATEWAY_RSA_PUBLIC_KEY' } });
    expect(rsaPublicKey).to.not.equal(null);
  });

  it('should be idempotent', async () => {
    await migration.up();
    await migration.up();

    expect(await getLock()).to.equal(null);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
