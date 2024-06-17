module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_tag_scene', {
      scene_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 't_scene',
          key: 'id',
        },
      },
      name: {
        allowNull: false,
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
    await queryInterface.dropTable('t_tag_scene');
  },
};
