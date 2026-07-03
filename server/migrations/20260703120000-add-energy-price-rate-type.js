module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_energy_price', 'rate_type', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async () => {},
};
