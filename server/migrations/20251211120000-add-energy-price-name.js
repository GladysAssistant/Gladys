module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_energy_price', 'contract_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Update existing rows to set contract_name based on contract type
    await queryInterface.sequelize.query(`
      UPDATE t_energy_price 
      SET contract_name = contract
      WHERE contract_name IS NULL
    `);
  },
  down: async (queryInterface, Sequelize) => {},
};
