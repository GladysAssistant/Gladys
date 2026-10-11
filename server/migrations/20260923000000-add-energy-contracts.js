// Energy contracts (docs/specs/energy-contracts.md, section 4): the contract
// object, the tariff calendars and their dated entries. t_energy_price is kept
// untouched for the compatibility window (section 9), so the down migration
// only drops the three new tables.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_energy_contract', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      electric_meter_device_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 't_device',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      energy_type: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'electricity',
      },
      direction: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'consumption',
      },
      valid_from: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      valid_to: {
        allowNull: true,
        type: Sequelize.DATEONLY,
      },
      currency: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      timezone: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      billing_period_start_day: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      subscribed_power: {
        allowNull: true,
        type: Sequelize.DECIMAL,
      },
      power_unit: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      provider_kind: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'user',
      },
      provider_service_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_service',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      template_key: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      template_version: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      pricing_mode: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'rules',
      },
      tariff: {
        allowNull: false,
        type: Sequelize.JSON,
      },
      inputs: {
        allowNull: true,
        type: Sequelize.JSON,
      },
      migration_warning: {
        allowNull: true,
        type: Sequelize.JSON,
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
    await queryInterface.addIndex('t_energy_contract', ['electric_meter_device_id']);
    await queryInterface.addIndex('t_energy_contract', ['valid_from', 'valid_to']);
    await queryInterface.addIndex('t_energy_contract', ['provider_service_id']);

    await queryInterface.createTable('t_tariff_calendar', {
      key: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      provider_service_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_service',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      granularity: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'day',
      },
      timezone: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      day_starts_at: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: '00:00',
      },
      values: {
        allowNull: true,
        type: Sequelize.JSON,
      },
      currency: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      first_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      last_at: {
        allowNull: true,
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('t_tariff_calendar', ['provider_service_id']);

    await queryInterface.createTable('t_tariff_calendar_entry', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      calendar_key: {
        allowNull: false,
        type: Sequelize.STRING,
        references: {
          model: 't_tariff_calendar',
          key: 'key',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      starts_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      value_string: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      value_number: {
        allowNull: true,
        type: Sequelize.DECIMAL,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('t_tariff_calendar_entry', ['calendar_key', 'starts_at'], {
      unique: true,
      name: 't_tariff_calendar_entry_calendar_key_starts_at',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('t_tariff_calendar_entry');
    await queryInterface.dropTable('t_tariff_calendar');
    await queryInterface.dropTable('t_energy_contract');
  },
};
