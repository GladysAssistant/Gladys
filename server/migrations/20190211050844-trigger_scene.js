module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_trigger_scene', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      trigger_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_trigger',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      scene_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_scene',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    await queryInterface.addIndex('t_trigger_scene', {
      fields: ['trigger_id', 'scene_id'],
      unique: true,
    });
    await queryInterface.addIndex('t_trigger_scene', ['trigger_id']);
    await queryInterface.addIndex('t_trigger_scene', ['scene_id']);
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_trigger_scene'),
};
