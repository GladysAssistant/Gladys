const { addSelectorBeforeValidateHook } = require('../utils/addSelector');
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
      start_date: {
        allowNull: false,
        type: DataTypes.DATEONLY,
      },
      end_date: {
        allowNull: true,
        type: DataTypes.DATEONLY,
      },
      contract: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      price_type: {
        allowNull: false,
        type: DataTypes.STRING,
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
        type: DataTypes.STRING,
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
