const { EVENT_LOG_TYPES } = require('../utils/constants');

module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('t_event_log', {
        id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4,
          },
          service: {
            allowNull: false,
            type: Sequelize.ENUM(Object.keys(EVENT_LOG_TYPES))
          },
          type: {
            allowNull: false,
            type: Sequelize.ENUM(Object.values(EVENT_LOG_TYPES).flat())
          },
          sender_name: {
            allowNull: true,
            type: Sequelize.STRING,
          },
          event_property: {
            allowNull: true,
            type: Sequelize.STRING,
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
    },
    down: async (queryInterface, Sequelize) => {
      await queryInterface.dropTable('t_event_log');
    },
  };
  