module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_job', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      progress: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      data: {
        allowNull: false,
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

    await queryInterface.addIndex('t_job', ['created_at']);
    await queryInterface.addIndex('t_job', ['type']);
  },

  down: async (queryInterface, Sequelize) => {},
};
