const { SERVICE_TYPES, SERVICE_TYPES_LIST } = require('../utils/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_service', 'type', {
      type: Sequelize.ENUM(SERVICE_TYPES_LIST),
      allowNull: false,
      defaultValue: SERVICE_TYPES.INTERNAL,
    });
    await queryInterface.addColumn('t_service', 'docker_image', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('t_service', 'manifest', {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await queryInterface.addColumn('t_service', 'container_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('t_service', 'failure_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('t_service', 'last_heartbeat', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('t_service', 'token_version', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('t_service', 'store_slug', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async () => {},
};
