const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const { ACTION_LIST, EVENT_LIST, ALARM_MODES_LIST } = require('../utils/constants');
const { addSelector } = require('../utils/addSelector');
const iconList = require('../config/icons.json');

const actionSchema = Joi.array().items(
  Joi.array().items(
    Joi.object().keys({
      type: Joi.string()
        .valid(...ACTION_LIST)
        .required(),
      device_feature: Joi.string(),
      device_features: Joi.array().items(Joi.string()),
      device: Joi.string(),
      devices: Joi.array().items(Joi.string()),
      user: Joi.string(),
      house: Joi.string(),
      scene: Joi.string(),
      camera: Joi.string(),
      text: Joi.string(),
      value: Joi.number(),
      evaluate_value: Joi.string(),
      minutes: Joi.number(),
      unit: Joi.string(),
      url: Joi.string().uri(),
      body: Joi.string(),
      method: Joi.string().valid('get', 'post', 'patch', 'put', 'delete'),
      days_of_the_week: Joi.array().items(
        Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      ),
      before: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/),
      after: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/),
      calendar_event_name_comparator: Joi.string().valid(
        'is-exactly',
        'contains',
        'starts-with',
        'ends-with',
        'has-any-name',
      ),
      calendars: Joi.array().items(Joi.string()),
      calendar_event_name: Joi.string(),
      stop_scene_if_event_found: Joi.boolean(),
      stop_scene_if_event_not_found: Joi.boolean(),
      request_response_keys: Joi.array().items(Joi.string()),
      ecowatt_network_status: Joi.string().valid('ok', 'warning', 'critical'),
      headers: Joi.array().items(
        Joi.object().keys({
          key: Joi.string(),
          value: Joi.string(),
        }),
      ),
      conditions: Joi.array().items({
        variable: Joi.string().required(),
        operator: Joi.string()
          .valid('=', '!=', '>', '>=', '<', '<=')
          .required(),
        value: Joi.number(),
        evaluate_value: Joi.string(),
      }),
      alarm_mode: Joi.string().valid(...ALARM_MODES_LIST),
      topic: Joi.string(),
      message: Joi.string().allow(''),
    }),
  ),
);

const triggersSchema = Joi.array().items(
  Joi.object().keys({
    type: Joi.string()
      .valid(...EVENT_LIST)
      .required(),
    house: Joi.string(),
    device: Joi.string(),
    device_feature: Joi.string(),
    operator: Joi.string().valid('=', '!=', '>', '>=', '<', '<='),
    value: Joi.number(),
    user: Joi.string(),
    area: Joi.string(),
    scheduler_type: Joi.string().valid('every-month', 'every-week', 'every-day', 'interval', 'custom-time'),
    // Calendar event
    calendar_event_attribute: Joi.string().valid('start', 'end'),
    calendar_event_name_comparator: Joi.string().valid(
      'is-exactly',
      'contains',
      'starts-with',
      'ends-with',
      'has-any-name',
    ),
    calendars: Joi.array().items(Joi.string()),
    calendar_event_name: Joi.string(),
    duration: Joi.number(),
    // End of calendar checks
    date: Joi.date().format('YYYY-MM-DD'),
    time: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/),
    interval: Joi.number(),
    unit: Joi.string(),
    days_of_the_week: Joi.array().items(
      Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    ),
    day_of_the_month: Joi.number()
      .min(1)
      .max(31),
    threshold_only: Joi.boolean(),
    topic: Joi.string(),
    message: Joi.string().allow(''),
  }),
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
        type: DataTypes.STRING,
      },
      description: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      icon: {
        allowNull: false,
        type: DataTypes.ENUM(iconList),
      },
      active: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
            const result = actionSchema.validate(value);
            if (result.error) {
              throw new Error(result.error.details[0].message);
            }
          },
        },
      },
      triggers: {
        type: DataTypes.JSON,
        validate: {
          isEven(value) {
            const result = triggersSchema.validate(value);
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
    scene.hasMany(models.TagScene, {
      foreignKey: 'scene_id',
      sourceKey: 'id',
      as: 'tags',
    });
  };

  return scene;
};
