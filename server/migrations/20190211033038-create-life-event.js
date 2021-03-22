module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_life_event', {
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
      house_id: {
        type: Sequelize.UUID,
        references: {
          model: 't_house',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      data: {
        type: Sequelize.JSON,
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

    await queryInterface.addIndex('t_life_event', ['user_id']);
    await queryInterface.addIndex('t_life_event', ['house_id']);
    await queryInterface.addIndex('t_life_event', ['type']);
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_life_event'),
};
