module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_calendar',
      [
        {
          id: '07ec2599-3221-4d6c-ac56-41443973201b',
          name: 'Test Calendar',
          selector: 'test-calendar',
          description: 'Test calendar',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_calendar', null, {}),
};
