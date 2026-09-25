const {
  ENERGY_CONTRACT_PROVIDER_KINDS,
  ENERGY_CONTRACT_PROVIDER_KINDS_LIST,
  ENERGY_CONTRACT_PRICING_MODES,
  ENERGY_CONTRACT_PRICING_MODES_LIST,
  ENERGY_CONTRACT_ENERGY_TYPES,
  ENERGY_CONTRACT_ENERGY_TYPES_LIST,
  ENERGY_CONTRACT_DIRECTIONS,
  ENERGY_CONTRACT_DIRECTIONS_LIST,
  ENERGY_CONTRACT_POWER_UNITS_LIST,
} = require('../utils/constants');
const { addSelectorBeforeValidateHook } = require('../utils/addSelector');

// One row per energy contract of a root meter (docs/specs/energy-contracts.md, section 4).
// The tariff definition is stored as JSON and validated by the manager before any write.
module.exports = (sequelize, DataTypes) => {
  const energyContract = sequelize.define(
    't_energy_contract',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          len: [1, 128],
        },
      },
      electric_meter_device_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_device',
          key: 'id',
        },
      },
      energy_type: {
        allowNull: false,
        type: DataTypes.ENUM(ENERGY_CONTRACT_ENERGY_TYPES_LIST),
        defaultValue: ENERGY_CONTRACT_ENERGY_TYPES.ELECTRICITY,
      },
      direction: {
        allowNull: false,
        type: DataTypes.ENUM(ENERGY_CONTRACT_DIRECTIONS_LIST),
        defaultValue: ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION,
      },
      valid_from: {
        allowNull: false,
        type: DataTypes.DATEONLY,
      },
      valid_to: {
        allowNull: true,
        type: DataTypes.DATEONLY,
        set(value) {
          // The frontend sends an empty string for "ongoing"
          this.setDataValue('valid_to', value === '' ? null : value);
        },
      },
      currency: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          is: /^[A-Z]{3}$/,
        },
      },
      timezone: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      billing_period_start_day: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 31,
        },
      },
      subscribed_power: {
        allowNull: true,
        type: DataTypes.DECIMAL,
      },
      power_unit: {
        allowNull: true,
        type: DataTypes.ENUM(ENERGY_CONTRACT_POWER_UNITS_LIST),
      },
      provider_kind: {
        allowNull: false,
        type: DataTypes.ENUM(ENERGY_CONTRACT_PROVIDER_KINDS_LIST),
        defaultValue: ENERGY_CONTRACT_PROVIDER_KINDS.USER,
      },
      provider_service_id: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 't_service',
          key: 'id',
        },
      },
      template_key: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      template_version: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      pricing_mode: {
        allowNull: false,
        type: DataTypes.ENUM(ENERGY_CONTRACT_PRICING_MODES_LIST),
        defaultValue: ENERGY_CONTRACT_PRICING_MODES.RULES,
      },
      tariff: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      inputs: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      // Set by the migration from t_energy_price when the legacy and the new
      // calculation disagree by more than 0.5% over the last 7 days (section 9.3).
      migration_warning: {
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    {},
  );

  energyContract.beforeValidate(addSelectorBeforeValidateHook);

  energyContract.associate = (models) => {
    energyContract.belongsTo(models.Device, {
      foreignKey: 'electric_meter_device_id',
      targetKey: 'id',
      as: 'electric_meter_device',
    });
    energyContract.belongsTo(models.Service, {
      foreignKey: 'provider_service_id',
      targetKey: 'id',
      as: 'provider_service',
    });
  };

  return energyContract;
};
