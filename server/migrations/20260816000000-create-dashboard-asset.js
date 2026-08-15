module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_dashboard_asset', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      dashboard_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 't_dashboard',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      content_type: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      data: {
        allowNull: false,
        type: Sequelize.BLOB,
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

    await queryInterface.addIndex('t_dashboard_asset', ['dashboard_id']);
  },
  down: async (queryInterface) => queryInterface.dropTable('t_dashboard_asset'),
};
