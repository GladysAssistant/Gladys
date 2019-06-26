const Joi = require('joi');
const { ACTION_LIST } = require('../utils/constants');
const { addSelector } = require('../utils/addSelector');
const iconList = require('../config/icons.json');

const actionSchema = Joi.array().items(
  Joi.array().items(
    Joi.object().keys({
      type: Joi.string()
        .valid(ACTION_LIST)
        .required(),
      deviceFeature: Joi.string(),
      device: Joi.string(),
      user: Joi.string(),
      text: Joi.string(),
      milliseconds: Joi.number(),
      seconds: Joi.number(),
      minutes: Joi.number(),
      hours: Joi.number(),
    }),
  ),
);

module.exports = (sequelize, DataTypes) => {
  const scene = sequelize.define(
    't_scene',
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
      icon: {
        allowNull: false,
        type: DataTypes.ENUM(iconList),
      },
      selector: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
        validate: {
          is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        },
      },
      actions: {
        allowNull: false,
        type: DataTypes.JSON,
        validate: {
          isEven(value) {
            const result = Joi.validate(value, actionSchema);
            if (result.error) {
              throw new Error(result.error.details[0].message);
            }
          },
        },
      },
      last_executed: {
        type: DataTypes.DATE,
      },
    },
    {},
  );

  // add slug if needed
  scene.beforeValidate(addSelector);

  scene.associate = (models) => {
    scene.belongsToMany(models.Trigger, {
      through: {
        model: models.TriggerScene,
        unique: true,
      },
      foreignKey: 'scene_id',
      as: 'triggers',
    });
  };

  return scene;
};
