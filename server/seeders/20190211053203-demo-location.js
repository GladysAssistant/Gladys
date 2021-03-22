module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_location',
      [
        {
          id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          latitude: 10,
          longitude: 10,
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_location', null, {}),
};
