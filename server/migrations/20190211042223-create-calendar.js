module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_calendar', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      user_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      service_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_service',
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
      external_id: {
        unique: true,
        type: Sequelize.STRING,
      },
      description: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      sync: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      notify: {
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

    await queryInterface.addIndex('t_calendar', ['user_id']);
    await queryInterface.addIndex('t_calendar', ['service_id']);
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_calendar'),
};
