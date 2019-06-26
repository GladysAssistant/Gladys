const Joi = require('joi');
const { EVENT_LIST, CONDITION_LIST } = require('../utils/constants');
const { addSelector } = require('../utils/addSelector');

const ruleSchema = Joi.object().keys({
  house: Joi.string(),
  deviceFeature: Joi.string(),
  user: Joi.string(),
  conditions: Joi.array().items(
    Joi.object().keys({
      type: Joi.string()
        .valid(CONDITION_LIST)
        .required(),
      house: Joi.string(),
      deviceFeature: Joi.string(),
      user: Joi.string(),
    }),
  ),
});

module.exports = (sequelize, DataTypes) => {
  const trigger = sequelize.define(
    't_trigger',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM(EVENT_LIST),
      },
      active: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      rule: {
        allowNull: false,
        type: DataTypes.JSON,
        validate: {
          isEven(value) {
            const result = Joi.validate(value, ruleSchema);
            if (result.error) {
              throw new Error(result.error.details[0].message);
            }
          },
        },
      },
      last_triggered: {
        type: DataTypes.DATE,
      },
    },
    {},
  );

  // add slug if needed
  trigger.beforeValidate(addSelector);

  trigger.associate = (models) => {
    trigger.belongsToMany(models.Scene, {
      through: {
        model: models.TriggerScene,
        unique: true,
      },
      foreignKey: 'trigger_id',
      as: 'scenes',
    });
  };

  return trigger;
};
