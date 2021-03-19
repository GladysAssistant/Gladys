module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_house',
      [
        {
          id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
          name: 'Test house',
          latitude: 12,
          longitude: 12,
          selector: 'test-house',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: '6295ad8b-b655-4422-9e6d-b4612da5d55f',
          name: 'Peppers house',
          selector: 'pepper-house',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_house', null, {}),
};
