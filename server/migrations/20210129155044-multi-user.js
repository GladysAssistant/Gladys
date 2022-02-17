const db = require('../models');
const logger = require('../utils/logger');
const { USER_ROLE } = require('../utils/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_dashboard', 'user_id', {
      allowNull: true,
      type: Sequelize.UUID,
      references: {
        model: 't_user',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    const users = await db.User.findAll({
      where: {
        role: USER_ROLE.ADMIN,
      },
      raw: true,
    });
    logger.info(`Multi-user migration: ${users.length} users found`);
    if (users.length) {
      const adminUser = users[0];
      await db.Dashboard.update(
        {
          user_id: adminUser.id,
          selector: `${adminUser.selector}-home`,
        },
        { where: {} },
      );
    }
  },

  down: async (queryInterface, Sequelize) => {},
};
