module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_room',
      [
        {
          id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
          name: 'Test room',
          selector: 'test-room',
          house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_room', null, {}),
};
