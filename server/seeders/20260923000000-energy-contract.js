module.exports = {
  async up() {
    // Nothing to insert here: the tests create their own contracts and calendars
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('t_tariff_calendar_entry', null, {});
    await queryInterface.bulkDelete('t_tariff_calendar', null, {});
    await queryInterface.bulkDelete('t_energy_contract', null, {});
  },
};
