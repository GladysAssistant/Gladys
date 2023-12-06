const { ACTIONS, EVENTS } = require('../utils/constants');

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_scene',
      [
        {
          id: '3a30636c-b3f0-4251-a347-90787f0fe940',
          name: 'Test scene',
          icon: 'fe fe-bell',
          selector: 'test-scene',
          actions: JSON.stringify([
            [
              {
                type: ACTIONS.LIGHT.TURN_ON,
                deviceFeature: 'light-1',
              },
            ],
          ]),
          triggers: '[]',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: '88428a7d-ea9d-46a6-b0d2-46bf82d37e53',
          name: 'To Duplicate scene',
          icon: 'fe fe-bell',
          selector: 'to-duplicate-scene',
          actions: JSON.stringify([
            [
              {
                type: ACTIONS.LIGHT.TURN_ON,
              },
            ],
          ]),
          triggers: JSON.stringify([
            {
              type: EVENTS.TIME.CHANGED,
              scheduler_type: 'every-day',
              time: '12:00',
            },
          ]),
          created_at: '2022-04-15 07:49:07.556 +00:00',
          updated_at: '2022-04-15 07:49:07.556 +00:00',
        },
        {
          id: '956794d8-a9cb-49bf-a677-57e820288b5a',
          name: 'Scene with tags',
          icon: 'fe fe-bell',
          selector: 'scene-with-tag',
          actions: JSON.stringify([
            [
              {
                type: ACTIONS.LIGHT.TURN_ON,
              },
            ],
          ]),
          triggers: JSON.stringify([
            {
              type: EVENTS.TIME.CHANGED,
              scheduler_type: 'every-day',
              time: '12:00',
            },
          ]),
          created_at: '2022-04-15 07:49:07.556 +00:00',
          updated_at: '2022-04-15 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_scene', null, {}),
};
