module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_calendar_event',
      [
        {
          id: '2ae9c476-3230-4f82-8f93-5ebfac15e736',
          name: 'Test Calendar Event',
          selector: 'test-calendar-event',
          start: '2019-02-12 07:49:07.556 +00:00',
          end: '2019-02-12 08:49:07.556 +00:00',
          calendar_id: '07ec2599-3221-4d6c-ac56-41443973201b',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_calendar_event', null, {}),
};
