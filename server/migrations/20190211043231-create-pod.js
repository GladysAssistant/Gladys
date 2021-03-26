module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_pod', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      room_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_room',
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
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('t_pod', ['room_id']);
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_pod'),
};
