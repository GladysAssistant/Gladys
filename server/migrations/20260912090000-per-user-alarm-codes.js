const Promise = require('bluebird');
const { v4: uuid } = require('uuid');

const passwordUtils = require('../utils/password');
const logger = require('../utils/logger');
const { USER_ROLE } = require('../utils/constants');

const FIRST_ADMIN_QUERY = `SELECT id FROM t_user WHERE role = :role ORDER BY created_at ASC LIMIT 1`;

/**
 * @description Move the clear-text code of every house into t_alarm_code, hashed.
 * The first code found goes to the oldest admin — the closest thing to an owner Gladys records,
 * t_house having no owner column. Any further distinct code becomes a guest code named after its
 * house, so a second house with its own code keeps working. Identical codes are not duplicated.
 * @param {object} queryInterface - Sequelize query interface.
 * @returns {Promise} Resolve when every house code has been migrated.
 * @example
 * await migrateHouseCodes(queryInterface);
 */
async function migrateHouseCodes(queryInterface) {
  const [houses] = await queryInterface.sequelize.query(
    `SELECT id, name, alarm_code FROM t_house
     WHERE alarm_code IS NOT NULL AND alarm_code != ''
     ORDER BY created_at ASC`,
  );

  if (houses.length === 0) {
    return;
  }

  const [admins] = await queryInterface.sequelize.query(FIRST_ADMIN_QUERY, {
    replacements: { role: USER_ROLE.ADMIN },
  });
  const firstAdminId = admins.length > 0 ? admins[0].id : null;
  const migratedCodes = new Set();
  const now = new Date();

  await Promise.each(houses, async (house) => {
    if (migratedCodes.has(house.alarm_code)) {
      return;
    }
    // The very first code is the one the owner of the instance knows: it becomes their personal
    // code. The following ones have no obvious holder, so they stay usable as guest codes.
    const givenToAdmin = migratedCodes.size === 0 && firstAdminId !== null;
    migratedCodes.add(house.alarm_code);
    logger.info(
      givenToAdmin
        ? `Alarm code of house ${house.name} migrated to the first admin user`
        : `Alarm code of house ${house.name} migrated to a guest code named after it`,
    );
    await queryInterface.bulkInsert('t_alarm_code', [
      {
        id: uuid(),
        user_id: givenToAdmin ? firstAdminId : null,
        name: givenToAdmin ? null : house.name,
        code: await passwordUtils.hash(house.alarm_code),
        valid_until: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  });

  // The column itself stays: no migration in this repo drops a column, and on SQLite dropping one
  // means recreating t_house and its foreign keys. It is gone from the Sequelize model, so nothing
  // reads it, writes it or serializes it any more.
  await queryInterface.sequelize.query(`UPDATE t_house SET alarm_code = NULL`);
}

module.exports = {
  migrateHouseCodes,
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_alarm_code', {
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
    });

    // One code per person, enforced by the database rather than by a check the next caller may
    // forget. Guest codes have no user, and there can be any number of them.
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX t_alarm_code_user_id ON t_alarm_code (user_id) WHERE user_id IS NOT NULL`,
    );

    await migrateHouseCodes(queryInterface);
  },
  down: async () => {},
};
