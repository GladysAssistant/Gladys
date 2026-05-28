module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_message', 'message_type', {
      allowNull: false,
      type: Sequelize.STRING,
      defaultValue: 'chat',
    });
    await queryInterface.addColumn('t_message', 'tool_name', {
      allowNull: true,
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('t_message', 'tool_status', {
      allowNull: true,
      type: Sequelize.STRING,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('t_message', 'tool_status');
    await queryInterface.removeColumn('t_message', 'tool_name');
    await queryInterface.removeColumn('t_message', 'message_type');
  },
};
