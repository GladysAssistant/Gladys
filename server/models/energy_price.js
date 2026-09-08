const { ENERGY_CONTRACT_TYPES_LIST, ENERGY_PRICE_TYPES_LIST } = require('../utils/constants');
const { slugify } = require('../utils/slugify');

module.exports = (sequelize, DataTypes) => {
  const energyPrice = sequelize.define(
    't_energy_price',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      contract_name: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      start_date: {
        allowNull: false,
        type: DataTypes.DATEONLY,
      },
      end_date: {
        allowNull: true,
        type: DataTypes.DATEONLY,
        set(value) {
          // Convert empty string to null
          this.setDataValue('end_date', value === '' ? null : value);
        },
      },
      contract: {
        allowNull: false,
        type: DataTypes.ENUM(...ENERGY_CONTRACT_TYPES_LIST),
      },
      price_type: {
        allowNull: false,
        type: DataTypes.ENUM(...ENERGY_PRICE_TYPES_LIST),
      },
      price: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      currency: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      electric_meter_device_id: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 't_device',
          key: 'id',
        },
      },
      hour_slots: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      subscribed_power: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      // Free day type: the Tempo colors (red, white, blue) for edf-tempo
      // contracts, any slug for day-type contracts (weekday, weekend,
      // holiday... whatever the energy calendar provider publishes). Was an
      // ENUM of the Tempo colors: under SQLite an ENUM is a TEXT column, so
      // the widening needs no migration.
      day_type: {
        allowNull: true,
        type: DataTypes.STRING,
        validate: {
          is: /^[a-z0-9][a-z0-9-]{0,31}$/,
        },
      },
      selector: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
    },
    {},
  );

  energyPrice.beforeValidate((item) => {
    // If selector still missing (no name field on this model), generate from key fields
    if (item.isNewRecord && !item.selector) {
      const base = [
        item.contract,
        item.price_type,
        item.currency,
        item.start_date,
        item.day_type || 'any',
        item.electric_meter_device_id,
        item.hour_slots,
        item.subscribed_power,
        item.day_type,
      ].join('-');
      item.selector = slugify(base, true);
    }
  });

  energyPrice.associate = (models) => {
    energyPrice.belongsTo(models.Device, {
      foreignKey: 'electric_meter_device_id',
      targetKey: 'id',
      as: 'electric_meter_device',
    });
  };

  return energyPrice;
};
