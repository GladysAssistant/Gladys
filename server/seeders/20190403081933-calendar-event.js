module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_calendar_event',
      [
        {
          id: '2ae9c476-3230-4f82-8f93-5ebfac15e736',
          external_id: 'd5ad1bd8-96a1-44ed-b103-98515892c2d0',
          name: 'Test Calendar Event',
          description: 'Description test Calendar Event',
          selector: 'test-calendar-event',
          start: '2019-02-12 07:49:07.556 +00:00',
          end: '2019-02-12 08:49:07.556 +00:00',
          url: '/remote.php/dav/calendars/tony/personal/eee42d70-24f2-4c18-949d-822f3f72594c.ics',
          calendar_id: '07ec2599-3221-4d6c-ac56-41443973201b',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: 'f2d58e17-bea5-4922-b15b-afbd4ad923dc',
          external_id: 'b22891f7-692e-496f-a180-ed085bd99042',
          name: 'Test Calendar Event 2',
          description: 'Description test Calendar Event 2',
          selector: 'test-calendar-event-2',
          start: '2019-03-12 07:49:07.556 +00:00',
          end: '2019-03-12 08:49:07.556 +00:00',
          url: '/remote.php/dav/calendars/tony/personal/47e754ac-bcef-4b53-ba5b-29dfb588e196.ics',
          calendar_id: '07ec2599-3221-4d6c-ac56-41443973201b',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_calendar_event', null, {}),
};
