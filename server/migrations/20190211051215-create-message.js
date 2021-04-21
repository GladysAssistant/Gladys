module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_message', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      sender_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      receiver_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      text: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      file: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      conversation_id: {
        allowNull: false,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      is_read: {
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

    await queryInterface.addIndex('t_message', ['sender_id']);
    await queryInterface.addIndex('t_message', ['receiver_id']);
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_message'),
};
