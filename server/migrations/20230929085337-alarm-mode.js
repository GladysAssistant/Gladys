const { ALARM_MODES } = require('../utils/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_house', 'alarm_mode', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ALARM_MODES.DISARMED,
    });
    await queryInterface.addColumn('t_house', 'alarm_code', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('t_house', 'alarm_delay_before_arming', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 10,
    });
    await queryInterface.addColumn('t_session', 'tablet_mode', {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('t_session', 'tablet_mode_locked', {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('t_session', 'current_house_id', {
      allowNull: true,
      type: Sequelize.UUID,
      references: {
        model: 't_house',
        key: 'id',
      },
    });
  },

  down: async () => {},
};
