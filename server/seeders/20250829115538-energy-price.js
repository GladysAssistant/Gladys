module.exports = {
  async up(queryInterface, Sequelize) {
    // Nothing to insert here
  },

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_energy_price', null, {}),
};
