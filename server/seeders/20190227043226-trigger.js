const { EVENTS, CONDITIONS } = require('../utils/constants');

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_trigger',
      [
        {
          id: '1763b345-b2b6-4c9b-8fed-ae017109956c',
          name: 'Test trigger',
          selector: 'test-trigger',
          type: EVENTS.LIGHT.TURNED_ON,
          active: true,
          rule: JSON.stringify({
            deviceFeature: 'main-light',
            conditions: [
              {
                type: CONDITIONS.HOUSE_ALARM.IS_ARMED,
                house: 'main-house',
              },
            ],
          }),
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_trigger', null, {}),
};
