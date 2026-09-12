const Promise = require('bluebird');
const { v4: uuid } = require('uuid');

const passwordUtils = require('../utils/password');
const logger = require('../utils/logger');

/**
 * @description Move the clear-text code of every house into t_alarm_code, hashed.
 * A house code was shared by the whole household, so it becomes a **guest** code named after its
 * house rather than the personal code of one person: nobody is handed a code that was not theirs,
 * no profile screen invites its holder to replace what everybody else still types, and deleting an
 * account never takes the household code with it. Identical codes are not duplicated.
 * @param {object} queryInterface - Sequelize query interface.
 * @param {object} [transaction] - Transaction to run in, so an interrupted migration leaves nothing behind.
 * @returns {Promise} Resolve when every house code has been migrated.
 * @example
 * await migrateHouseCodes(queryInterface);
 */
async function migrateHouseCodes(queryInterface, transaction = undefined) {
  const [houses] = await queryInterface.sequelize.query(
    `SELECT id, name, alarm_code FROM t_house
     WHERE alarm_code IS NOT NULL AND alarm_code != ''
     ORDER BY created_at ASC`,
    { transaction },
  );

  if (houses.length === 0) {
    return;
  }

  const migratedCodes = new Set();
  const now = new Date();

  await Promise.each(houses, async (house) => {
    if (migratedCodes.has(house.alarm_code)) {
      return;
    }
    migratedCodes.add(house.alarm_code);
    logger.info(`Alarm code of house ${house.name} migrated to a guest code named after it`);
    await queryInterface.bulkInsert(
      't_alarm_code',
      [
        {
          id: uuid(),
          user_id: null,
          name: house.name,
          code: await passwordUtils.hash(house.alarm_code),
          valid_until: null,
          created_at: now,
          updated_at: now,
        },
      ],
      { transaction },
    );
  });

  // The column itself stays: no migration in this repo drops a column, and on SQLite dropping one
  // means recreating t_house and its foreign keys. It is gone from the Sequelize model, so nothing
  // reads it, writes it or serializes it any more.
  await queryInterface.sequelize.query(`UPDATE t_house SET alarm_code = NULL`, { transaction });
}

module.exports = {
  migrateHouseCodes,
  up: async (queryInterface, Sequelize) => {
    // One transaction for the whole migration: an instance interrupted midway comes back with no
    // table and its house codes intact, rather than with half the codes migrated and an index that
    // refuses the retry.
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        't_alarm_code',
        {
          id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
          },
          user_id: {
            allowNull: true,
            type: Sequelize.UUID,
            references: {
              model: 't_user',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          name: {
            allowNull: true,
            type: Sequelize.STRING,
          },
          code: {
            allowNull: false,
            type: Sequelize.STRING,
          },
          valid_until: {
            allowNull: true,
            type: Sequelize.DATE,
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      // One code per person, enforced by the database rather than by a check the next caller may
      // forget. Guest codes have no user, and there can be any number of them.
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX t_alarm_code_user_id ON t_alarm_code (user_id) WHERE user_id IS NOT NULL`,
        { transaction },
      );

      await migrateHouseCodes(queryInterface, transaction);
    });
  },
  down: async () => {},
};
