const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const {
  ACTION_LIST,
  ACTIONS,
  EVENT_LIST,
  ALARM_MODES_LIST,
  TRIGGER_OPERATORS,
  ANY_CHANGE_OPERATOR,
} = require('../utils/constants');
const { WEATHER_ALERT_TYPES, WEATHER_ALERT_SEVERITIES } = require('../lib/external-integration/constants');
const { addSelectorBeforeValidateHook } = require('../utils/addSelector');
const iconList = require('../config/icons.json');

// A real time of day: a loose /[0-9]{2}:[0-9]{2}/ also matches "99:99", which builds a
// node-schedule rule that never fires.
const HOUR_MINUTE_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

const actionSchema = Joi.object()
  .keys({
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
    // messaging channel of a "send message" action: null/absent means
    // broadcast to every channel the user configured
    service: Joi.string().allow(null),
    text: Joi.string(),
    name: Joi.string(),
    value: Joi.alternatives().try(Joi.number(), Joi.string()),
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
    stop_scene_if_no_events: Joi.boolean(),
    time_range: Joi.string().valid('today', 'tomorrow', 'next-x-hours'),
    // Null is allowed so that an action can be saved while the user has not
    // filled the number of hours yet.
    duration: Joi.number()
      .integer()
      .min(1)
      .allow(null),
    // Precision the "time.get-date" action truncates the current date/time to.
    precision: Joi.string().valid('second', 'minute', 'hour', 'day'),
    request_response_keys: Joi.array().items(Joi.string()),
    ecowatt_network_status: Joi.string().valid('ok', 'warning', 'critical'),
    edf_tempo_peak_day_type: Joi.string().valid('blue', 'white', 'red', 'no-check'),
    edf_tempo_day: Joi.string().valid('today', 'tomorrow'),
    edf_tempo_peak_hour_type: Joi.string().valid('peak-hour', 'off-peak-hour', 'no-check'),
    headers: Joi.alternatives().conditional('type', {
      is: ACTIONS.HTTP.REQUEST,
      then: Joi.array()
        .items(
          Joi.object().keys({
            key: Joi.string(),
            value: Joi.string(),
          }),
        )
        .required(),
      otherwise: Joi.forbidden(),
    }),
    conditions: Joi.array().items({
      variable: Joi.string().required(),
      operator: Joi.string()
        .valid('=', '!=', '>', '>=', '<', '<=')
        .required(),
      value: Joi.alternatives().try(Joi.number(), Joi.string()),
      evaluate_value: Joi.string(),
    }),
    alarm_mode: Joi.string().valid(...ALARM_MODES_LIST),
    topic: Joi.string(),
    message: Joi.string().allow(''),
    blinking_time: Joi.number(),
    blinking_speed: Joi.string().valid('slow', 'medium', 'fast'),
    volume: Joi.number()
      .integer()
      .max(100)
      .min(0),
    if: Joi.array().items(Joi.link('#action')),
    then: Joi.array().items(Joi.array().items(Joi.link('#action'))),
    else: Joi.array().items(Joi.array().items(Joi.link('#action'))),
    max_iterations: Joi.number()
      .integer()
      .min(1)
      .max(10000),
    // "scene.in-time-range" condition: true checks we are inside one of the time ranges of
    // the scene, false checks we are outside of them.
    in_range: Joi.boolean(),
  })
  // A "variable.set" action holds either a text or a formula, never both: the runtime
  // would only evaluate the formula and silently drop the text.
  .when(Joi.object({ type: Joi.valid(ACTIONS.VARIABLE.SET) }).unknown(), {
    then: Joi.object().oxor('text', 'evaluate_value'),
  })
  .id('action');

const actionsSchema = Joi.array().items(Joi.array().items(actionSchema));

const triggerSchema = Joi.object()
  .keys({
    type: Joi.string()
      .valid(...EVENT_LIST)
      .required(),
    house: Joi.string(),
    device: Joi.string(),
    device_feature: Joi.string(),
    device_features: Joi.array()
      .items(Joi.string())
      .min(1),
    // `changed` fires on any state change of the device feature, no value is needed
    operator: Joi.string().valid(...TRIGGER_OPERATORS),
    value: Joi.alternatives().try(Joi.number(), Joi.string()),
    user: Joi.string(),
    area: Joi.string(),
    scheduler_type: Joi.string().valid(
      'every-month',
      'every-week',
      'every-day',
      'interval',
      'custom-time',
      'time-range',
    ),
    // "time-range" scheduler: a list of ranges, each one firing the scene at its start and
    // at its end. The days of the week are shared by every range of the trigger
    // (`days_of_the_week`); ranges used to carry their own list, still accepted so a scene
    // saved by an earlier version stays editable and duplicable, but ignored by the runtime.
    // Times are validated as real times: "99:99" matches a loose HH:mm regex but produces a
    // node-schedule rule which never fires, so the trigger would be silently dead.
    time_ranges: Joi.array().items(
      Joi.object()
        .keys({
          start: Joi.string()
            .regex(HOUR_MINUTE_REGEX)
            .required(),
          end: Joi.string()
            .regex(HOUR_MINUTE_REGEX)
            .required(),
          days_of_the_week: Joi.array().items(
            Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
          ),
        })
        // A range starting and ending at the same time covers nothing, and would fire its
        // start and its end at the very same second. Rejected here so the scene is refused
        // before it reaches the database: scheduling it throws, which would otherwise leave
        // the saved scene out of the trigger store until the next restart.
        .custom((range, helpers) => (range.start === range.end ? helpers.error('any.invalid') : range), 'time range')
        .message('A time range cannot start and end at the same time'),
    ),
    resume_on_startup: Joi.boolean(),
    // Both sides of a range always fire: a scene reacting to only one of them leaves the
    // other branch of its "if/else" empty. These two flags used to make that configurable;
    // they are still accepted so a scene saved by an earlier version can be saved and
    // duplicated, but the runtime ignores them. They are not stripped: the model validator
    // only reads the validation error, so the value it would rewrite is discarded anyway.
    trigger_start: Joi.boolean(),
    trigger_end: Joi.boolean(),
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
    for_duration: Joi.number(),
    days_of_the_week: Joi.array().items(
      Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    ),
    day_of_the_month: Joi.number()
      .min(1)
      .max(31),
    threshold_only: Joi.boolean(),
    topic: Joi.string(),
    message: Joi.string().allow(''),
    offset: Joi.number()
      .integer()
      .min(-1440)
      .max(1440),
    // weather-alert triggers (B.18): phenomenon type filter and minimal severity
    weather_alert_type: Joi.string().valid(...WEATHER_ALERT_TYPES, 'any'),
    weather_alert_severity: Joi.string().valid(...WEATHER_ALERT_SEVERITIES),
  })
  // A "changed" trigger fires on `last_value !== previous_value`: it matches no value, and
  // neither `threshold_only` (which de-duplicates a condition staying true) nor `for_duration`
  // (which waits for it to stay true) applies to a change, which is instantaneous. Refusing
  // them here keeps a stored trigger consistent with what the runtime does, and matches the
  // MCP schemas.
  .when(Joi.object({ operator: Joi.valid(ANY_CHANGE_OPERATOR) }).unknown(), {
    then: Joi.object().keys({
      value: Joi.forbidden(),
      threshold_only: Joi.forbidden(),
      for_duration: Joi.forbidden(),
    }),
  })
  // A "time-range" trigger needs at least one range and at least one day, otherwise
  // scheduling it throws — and it throws after the scene has been written to the database,
  // leaving the saved scene out of the trigger store until the next restart. Refusing it
  // here rejects the save itself, with a message the editor can display.
  // Written as a custom rule rather than a second `.when()`: two chained `when` on the same
  // object merge destructively, and the branch of the second one ends up applying to every
  // trigger type.
  .custom((trigger, helpers) => {
    if (trigger.scheduler_type !== 'time-range') {
      return trigger;
    }
    if (!trigger.time_ranges || trigger.time_ranges.length === 0) {
      return helpers.message('A "time range" trigger needs at least one time range');
    }
    if (trigger.days_of_the_week && trigger.days_of_the_week.length === 0) {
      return helpers.message('A "time range" trigger needs at least one day of the week');
    }
    return trigger;
  }, 'time-range trigger');

const triggersSchema = Joi.array().items(triggerSchema);

/**
 * @description Build a flat validation message from Joi details.
 * @param {object} error - Joi validation error.
 * @returns {string} Flattened validation message.
 * @example
 * formatJoiValidationError({ details: [{ message: '"actions" must be an array' }] });
 */
function formatJoiValidationError(error) {
  if (!error || !Array.isArray(error.details) || error.details.length === 0) {
    return error?.message || 'Invalid schema';
  }
  return error.details.map((detail) => detail.message).join('; ');
}

/**
 * @description Scene database model definition.
 * @param {object} sequelize - Sequelize instance.
 * @param {object} DataTypes - Sequelize data types.
 * @returns {object} Scene model.
 * @example
 * module.exports(sequelize, Sequelize.DataTypes);
 */
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
            const result = actionsSchema.validate(value, { abortEarly: false });
            if (result.error) {
              throw new Error(formatJoiValidationError(result.error));
            }
          },
        },
      },
      triggers: {
        type: DataTypes.JSON,
        validate: {
          isEven(value) {
            const result = triggersSchema.validate(value, { abortEarly: false });
            if (result.error) {
              throw new Error(formatJoiValidationError(result.error));
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
  scene.beforeValidate(addSelectorBeforeValidateHook);

  scene.associate = (models) => {
    scene.hasMany(models.TagScene, {
      foreignKey: 'scene_id',
      sourceKey: 'id',
      as: 'tags',
    });
  };

  return scene;
};

module.exports.formatJoiValidationError = formatJoiValidationError;
