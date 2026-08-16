const Joi = require('joi');
const { addSelectorBeforeValidateHook } = require('../utils/addSelector');
const { normalizeDashboardBoxes } = require('../utils/dashboardSections');
const {
  DASHBOARD_BOX_TYPE_LIST,
  DASHBOARD_TYPE_LIST,
  DASHBOARD_VISIBILITY_LIST,
  DASHBOARD_CARD_STYLE_LIST,
} = require('../utils/constants');

const MAX_COLUMNS_PER_SECTION = 4;

const boxSchema = Joi.object().keys({
  type: Joi.string()
    .valid(...DASHBOARD_BOX_TYPE_LIST)
    .required(),
  house: Joi.string(),
  room: Joi.string(),
  camera: Joi.string(),
  name: Joi.string().allow(''),
  modes: Joi.object(),
  // weather box: provider pinned in the widget configuration, '' = automatic
  provider: Joi.string().allow(''),
  device: Joi.string(),
  device_features: Joi.array().items(Joi.string()),
  device_feature_names: Joi.array().items(Joi.string()),
  device_feature: Joi.string(),
  unit: Joi.string(),
  units: Joi.array().items(Joi.string().allow(null)),
  title: Joi.string(),
  interval: Joi.string(),
  aggregate_function: Joi.string().valid('avg', 'sum', 'max', 'min', 'count'),
  group_by: Joi.string().valid('hour', 'day', 'week', 'month', 'year'),
  display_axes: Joi.boolean(),
  display_variation: Joi.boolean(),
  chart_type: Joi.string(),
  users: Joi.array().items(Joi.string()),
  clock_type: Joi.string(),
  clock_display_second: Joi.boolean(),
  camera_latency: Joi.string(),
  camera_live_auto_start: Joi.boolean(),
  scenes: Joi.array().items(Joi.string()),
  // scene box: optional live status subtitle per scene button (scene selector -> device feature selector)
  scene_status_features: Joi.object().pattern(Joi.string(), Joi.string()),
  humidity_use_custom_value: Joi.boolean(),
  humidity_min: Joi.number(),
  humidity_max: Joi.number(),
  temperature_use_custom_value: Joi.boolean(),
  temperature_min: Joi.number(),
  temperature_max: Joi.number(),
  gauge_use_custom_value: Joi.boolean(),
  gauge_min: Joi.number(),
  gauge_max: Joi.number(),
  gauge_color_low: Joi.string(),
  gauge_color_in_range: Joi.string(),
  gauge_color_high: Joi.string(),
  colors: Joi.array().items(Joi.string()),
  show_subscription_prices: Joi.boolean(),
  url: Joi.string().uri({ scheme: ['http', 'https'] }),
  icon: Joi.string(),
  photos: Joi.array()
    .items(
      Joi.object().keys({
        // An empty URL is allowed so a widget being configured can still be saved,
        // empty rows are filtered out by the front-end before saving.
        url: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .allow('')
          .required(),
        caption: Joi.string().allow(''),
      }),
    )
    .max(100),
  // house-view box: an illustration with live device values pinned on it.
  // The image is either a bundled illustration ("gallery:<key>") or an
  // uploaded dashboard asset ("asset:<id>").
  image: Joi.string().pattern(/^(gallery|asset):[a-zA-Z0-9-]+$/),
  pins: Joi.array()
    .items(
      Joi.object().keys({
        x_pct: Joi.number()
          .min(0)
          .max(100)
          .required(),
        y_pct: Joi.number()
          .min(0)
          .max(100)
          .required(),
        device_feature: Joi.string().required(),
        label: Joi.string().allow(''),
        icon: Joi.string(),
      }),
    )
    .max(20),
  // chips box: an ordered list of compact state pills
  chips: Joi.array()
    .items(
      Joi.object().keys({
        chip_type: Joi.string()
          .valid('device-feature', 'openings', 'alarm', 'calendar-next-event')
          .required(),
        device_feature: Joi.string(),
        label: Joi.string().allow(''),
        icon: Joi.string(),
        house: Joi.string(),
        room: Joi.string(),
        calendars: Joi.array().items(Joi.string()),
        calendar_event_name_filter: Joi.string().allow(''),
      }),
    )
    .max(20),
  photo_fit: Joi.string().valid('cover', 'contain'),
  photo_slideshow_interval: Joi.number()
    .integer()
    .min(0)
    .max(3600),
  photo_show_caption: Joi.boolean(),
});

// A dashboard is a stack of sections, each section holding its own columns
// (1 to MAX_COLUMNS_PER_SECTION). Legacy column-based values are normalized
// to this shape in a beforeValidate hook, so validation only sees sections.
const boxesSchema = Joi.array().items(
  Joi.object().keys({
    columns: Joi.array()
      .items(Joi.array().items(boxSchema))
      .max(MAX_COLUMNS_PER_SECTION)
      .required(),
  }),
);

module.exports = (sequelize, DataTypes) => {
  const dashboard = sequelize.define(
    't_dashboard',
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
      user_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM(DASHBOARD_TYPE_LIST),
      },
      position: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      visibility: {
        allowNull: false,
        type: DataTypes.ENUM(DASHBOARD_VISIBILITY_LIST),
      },
      icon: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      background_image: {
        allowNull: true,
        type: DataTypes.TEXT,
        validate: {
          isHttpUrl(value) {
            if (value !== null && value !== undefined && !/^https?:\/\//.test(value)) {
              throw new Error('background_image must be an http(s) URL');
            }
          },
        },
      },
      card_style: {
        allowNull: true,
        type: DataTypes.ENUM(DASHBOARD_CARD_STYLE_LIST),
        validate: {
          isIn: [DASHBOARD_CARD_STYLE_LIST],
        },
      },
      boxes: {
        allowNull: false,
        type: DataTypes.JSON,
        validate: {
          isEven(value) {
            const result = boxesSchema.validate(value);
            if (result.error) {
              throw new Error(result.error.details[0].message);
            }
          },
        },
      },
    },
    {},
  );

  dashboard.beforeValidate(addSelectorBeforeValidateHook);
  dashboard.beforeValidate((instance) => {
    if (instance.boxes) {
      instance.boxes = normalizeDashboardBoxes(instance.boxes);
    }
  });

  return dashboard;
};
