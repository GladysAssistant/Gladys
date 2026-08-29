const Joi = require('joi');
const { addSelectorBeforeValidateHook } = require('../utils/addSelector');
const { normalizeDashboardBoxes, MAX_COLUMN_WIDTH } = require('../utils/dashboardSections');
const {
  DASHBOARD_BOX_TYPE_LIST,
  DASHBOARD_TYPE_LIST,
  DASHBOARD_VISIBILITY_LIST,
  DASHBOARD_WIDTH_LIST,
  DASHBOARD_BACKGROUND_SCENE_LIST,
} = require('../utils/constants');

const MAX_COLUMNS_PER_SECTION = 6;

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
  // cinema box: how many days ahead to look for upcoming movie releases, and
  // in which country's theatrical calendar (ISO 3166-1 alpha-2, ex. 'FR').
  // '' = automatic (service default, France), same convention as the
  // weather box's `provider` above. Uppercase only for a real code: Joi's
  // `.uppercase()` transform isn't applied back to the stored value here
  // (the isEven() validator below only checks for errors, it doesn't
  // persist the converted value), so a lowercase input would be accepted
  // but stored mismatched — the pattern rejects it outright instead, and
  // the editor UI always sends an uppercased value.
  days_ahead: Joi.number().valid(15, 30, 60),
  cinema_region: Joi.string()
    .pattern(/^[A-Z]{2}$/)
    .allow(''),
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
  period_start_day: Joi.number()
    .integer()
    .min(1)
    .max(31),
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
  // actions box: an ordered list of compact command buttons. A device-feature
  // action without a value toggles a binary feature; with a value it sends
  // that value (e.g. COVER_STATE open/stop/close for shutters).
  actions: Joi.array()
    .items(
      Joi.object().keys({
        action_type: Joi.string()
          .valid('scene', 'device-feature')
          .required(),
        scene: Joi.string(),
        device_feature: Joi.string(),
        label: Joi.string().allow(''),
        icon: Joi.string(),
        value: Joi.number(),
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
// widths holds one integer weight per column (1 = normal, 2 = wide); the
// beforeValidate hook aligns it to the columns and drops it when every
// column has the default weight, so it is optional here.
const boxesSchema = Joi.array().items(
  Joi.object().keys({
    columns: Joi.array()
      .items(Joi.array().items(boxSchema))
      .max(MAX_COLUMNS_PER_SECTION)
      .required(),
    widths: Joi.array()
      .items(
        Joi.number()
          .integer()
          .min(1)
          .max(MAX_COLUMN_WIDTH),
      )
      .max(MAX_COLUMNS_PER_SECTION),
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
      background_scene: {
        allowNull: true,
        type: DataTypes.STRING,
        validate: {
          isIn: [DASHBOARD_BACKGROUND_SCENE_LIST],
        },
      },
      width: {
        allowNull: true,
        type: DataTypes.ENUM(DASHBOARD_WIDTH_LIST),
        validate: {
          isIn: [DASHBOARD_WIDTH_LIST],
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
