module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_energy_price', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      contract: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      price_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      electric_meter_device_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 't_device',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      hour_slots: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      subscribed_power: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      day_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('t_energy_price', ['electric_meter_device_id']);
    await queryInterface.addIndex('t_energy_price', ['start_date', 'end_date']);
    await queryInterface.addIndex('t_energy_price', ['selector']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('t_energy_price');
  },
};
