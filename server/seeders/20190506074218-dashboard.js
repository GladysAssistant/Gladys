const { DASHBOARD_TYPE } = require('../utils/constants');

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_dashboard',
      [
        {
          id: '854dda11-80c0-4476-843b-65cbc95c6a85',
          name: 'Test dashboard',
          selector: 'test-dashboard',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          type: DASHBOARD_TYPE.MAIN,
          boxes: '[[{"type": "weather"}]]',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_dashboard', null, {}),
};
