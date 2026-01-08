const {
  ENERGY_CONTRACT_TYPES_LIST,
  ENERGY_PRICE_TYPES_LIST,
  ENERGY_PRICE_DAY_TYPES_LIST,
} = require('../utils/constants');
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
      day_type: {
        allowNull: true,
        type: DataTypes.ENUM(...ENERGY_PRICE_DAY_TYPES_LIST),
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
