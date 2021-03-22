module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_message',
      [
        {
          id: '247b1dd0-6fab-47a8-a9c8-1405deae0ae8',
          sender_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          receiver_id: null,
          text: 'What time is it ?',
          conversation_id: '5a4d1e8c-01b3-4f36-affa-bf7060a277ea',
          is_read: true,
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_message', null, {}),
};
