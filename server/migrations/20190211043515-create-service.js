module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_service', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      pod_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_pod',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      version: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      enabled: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      has_message_feature: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.addIndex('t_service', ['pod_id']);
    await queryInterface.addIndex('t_service', ['pod_id', 'name'], {
      unique: true,
    });
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_service'),
};
