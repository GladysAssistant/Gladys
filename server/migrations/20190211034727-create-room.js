module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_room', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      house_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 't_house',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      selector: {
        allowNull: false,
        unique: true,
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

    await queryInterface.addIndex('t_room', ['house_id']);
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_room'),
};
