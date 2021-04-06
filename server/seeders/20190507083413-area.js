module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_area',
      [
        {
          id: '939ff9b0-d349-483e-9a16-04e3ff03f1cd',
          name: 'Test area',
          selector: 'test-area',
          latitude: 10,
          longitude: 10,
          radius: 1000,
          color: '#0000',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_area', null, {}),
};
