const { ACTIONS } = require('../utils/constants');

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
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_scene', null, {}),
};
