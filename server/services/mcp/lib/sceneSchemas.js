const z = require('zod/v4');
const iconList = require('../../../config/icons.json');
const {
  ACTIONS,
  EVENTS,
  ALARM_MODES_LIST,
  COMPARISON_OPERATORS,
  ANY_CHANGE_OPERATOR,
} = require('../../../utils/constants');

const hhmmPattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const weekDaysSchema = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
const comparisonOperatorSchema = z.enum(COMPARISON_OPERATORS);
const calendarComparatorSchema = z.enum(['is-exactly', 'contains', 'starts-with', 'ends-with', 'has-any-name']);
const triggerCalendarEventAttributeSchema = z.enum(['start', 'end']);
// The days of the week are shared by every range, and live on the trigger itself.
// A range starting and ending at the same time covers nothing, and is rejected by the scene
// model: refusing it here too makes the tool fail with a message instead of failing later,
// deeper in the create.
const timeRangeSchema = z
  .object({
    start: z.string().regex(hhmmPattern),
    end: z.string().regex(hhmmPattern),
  })
  .refine((range) => range.start !== range.end, {
    message: 'A time range cannot start and end at the same time',
  });

const SCENE_TRIGGER_TYPES = new Set([
  EVENTS.DEVICE.NEW_STATE,
  EVENTS.TIME.CHANGED,
  EVENTS.TIME.SUNRISE,
  EVENTS.TIME.SUNSET,
  EVENTS.USER_PRESENCE.BACK_HOME,
  EVENTS.USER_PRESENCE.LEFT_HOME,
  EVENTS.HOUSE.EMPTY,
  EVENTS.HOUSE.NO_LONGER_EMPTY,
  EVENTS.AREA.USER_ENTERED,
  EVENTS.AREA.USER_LEFT,
  EVENTS.ALARM.ARM,
  EVENTS.ALARM.ARMING,
  EVENTS.ALARM.DISARM,
  EVENTS.ALARM.PARTIAL_ARM,
  EVENTS.ALARM.PANIC,
  EVENTS.ALARM.TOO_MANY_CODES_TESTS,
  EVENTS.SYSTEM.START,
  EVENTS.MQTT.RECEIVED,
  EVENTS.CALENDAR.EVENT_IS_COMING,
]);

/**
 * @description Flatten nested scene actions into a single list.
 * @param {Array} actions - Raw scene actions payload.
 * @returns {Array<object>} Flattened action objects.
 * @example
 * flattenSceneActions([[{ type: 'delay', unit: 'minutes', value: 1 }]]);
 */
function flattenSceneActions(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }

  return actions.flatMap((item) => {
    if (Array.isArray(item)) {
      return flattenSceneActions(item);
    }
    if (item && typeof item === 'object') {
      return [item];
    }
    return [];
  });
}

/**
 * @description Reject trigger types mistakenly placed in actions.
 * @param {object} scene - Raw scene payload from the model.
 * @throws {Error} When trigger types are found in actions.
 * @example
 * assertTriggerTypesNotInActions({ actions: [[{ type: 'device.new-state' }]] });
 */
function assertTriggerTypesNotInActions(scene) {
  const misplacedTriggers = flattenSceneActions(scene?.actions).filter((action) =>
    SCENE_TRIGGER_TYPES.has(action?.type),
  );

  if (misplacedTriggers.length === 0) {
    return;
  }

  const types = [...new Set(misplacedTriggers.map((action) => action.type))].join(', ');
  throw new Error(
    `scene.create validation failed (422): triggers: Trigger types (${types}) must be in the top-level triggers array, not in actions. Example triggers: [{"type":"device.new-state","device_feature":"mqtt-lumiere","operator":"=","value":1,"threshold_only":true,"for_duration":2700000}]`,
  );
}

const sceneConditionSchema = z
  .object({
    variable: z
      .string()
      .describe(
        'Scope path to compare, for example "0.0.last_value" after a device.get-value action in action group 0.',
      ),
    operator: comparisonOperatorSchema,
    value: z
      .union([z.number(), z.string()])
      .optional()
      .describe('Literal value to compare against.'),
    evaluate_value: z
      .string()
      .optional()
      .describe('Optional Handlebars expression evaluated to a value before comparison.'),
  })
  .strict();

const actionSchemaByType = (type, specificShape) =>
  z
    .object({
      type: z.literal(type),
      ...specificShape,
    })
    .strict();

const triggerSchemaByType = (type, specificShape) =>
  z
    .object({
      type: z.literal(type),
      ...specificShape,
    })
    .strict();

/**
 * @description Build Zod input schema for scene.create tool.
 * @param {Array<string>} [sceneSelectors] - Allowed scene selectors.
 * @param {Array<string>} [userSelectors] - Allowed user selectors.
 * @param {Array<string>} [houseSelectors] - Allowed house selectors.
 * @param {Array<string>} [lightDeviceSelectors] - Allowed light device selectors.
 * @param {Array<string>} [switchDeviceSelectors] - Allowed switch device selectors.
 * @param {Array<string>} [musicNotificationDeviceSelectors] - Allowed music notification device selectors.
 * @param {Array<string>} [deviceFeatureSelectors] - Allowed device feature selectors.
 * @param {Array<string>} [calendarSelectors] - Allowed calendar selectors.
 * @param {Array<string>} [areaSelectors] - Allowed area selectors.
 * @returns {object} Scene creation Zod schema.
 * @example
 * createSceneCreateInputSchema(['scene-a'], ['john'], ['main-house']);
 */
function createSceneCreateInputSchema(
  sceneSelectors = [],
  userSelectors = [],
  houseSelectors = [],
  lightDeviceSelectors = [],
  switchDeviceSelectors = [],
  musicNotificationDeviceSelectors = [],
  deviceFeatureSelectors = [],
  calendarSelectors = [],
  areaSelectors = [],
) {
  const sceneSelectorSchema = sceneSelectors.length > 0 ? z.enum(sceneSelectors) : z.string();
  const userSelectorSchema = userSelectors.length > 0 ? z.enum(userSelectors) : z.string();
  const houseSelectorSchema = houseSelectors.length > 0 ? z.enum(houseSelectors) : z.string();
  const lightDevicesSchema =
    lightDeviceSelectors.length > 0 ? z.array(z.enum(lightDeviceSelectors)) : z.array(z.string());
  const switchDevicesSchema =
    switchDeviceSelectors.length > 0 ? z.array(z.enum(switchDeviceSelectors)) : z.array(z.string());
  const musicNotificationDevicesSchema =
    musicNotificationDeviceSelectors.length > 0 ? z.enum(musicNotificationDeviceSelectors) : z.string();
  const deviceFeatureSelectorSchema = deviceFeatureSelectors.length > 0 ? z.enum(deviceFeatureSelectors) : z.string();
  const calendarSelectorSchema = calendarSelectors.length > 0 ? z.enum(calendarSelectors) : z.string();
  const areaSelectorSchema = areaSelectors.length > 0 ? z.enum(areaSelectors) : z.string();
  const messageServiceSchema = z
    .string()
    .nullish()
    .describe(
      'Name of the messaging service to send through (example: "telegram"). Omit or set to null to send to every messaging channel the user configured.',
    );
  const sceneActionSchema = z.lazy(() =>
    z.discriminatedUnion('type', [
      actionSchemaByType(ACTIONS.DEVICE.SET_VALUE, {
        device_feature: z.string().optional(),
        device: z.string().optional(),
        feature_category: z.string().optional(),
        feature_type: z.string().optional(),
        value: z.union([z.number(), z.string()]).optional(),
        evaluate_value: z.string().optional(),
      }),
      actionSchemaByType(ACTIONS.LIGHT.TURN_ON, {
        devices: lightDevicesSchema,
      }),
      actionSchemaByType(ACTIONS.LIGHT.TURN_OFF, {
        devices: lightDevicesSchema,
      }),
      actionSchemaByType(ACTIONS.LIGHT.TOGGLE, {
        devices: lightDevicesSchema,
      }),
      actionSchemaByType(ACTIONS.LIGHT.BLINK, {
        devices: lightDevicesSchema,
        blinking_speed: z.enum(['slow', 'medium', 'fast']),
        blinking_time: z.number(),
      }),
      actionSchemaByType(ACTIONS.SWITCH.TURN_ON, {
        devices: switchDevicesSchema,
      }),
      actionSchemaByType(ACTIONS.SWITCH.TURN_OFF, {
        devices: switchDevicesSchema,
      }),
      actionSchemaByType(ACTIONS.SWITCH.TOGGLE, {
        devices: switchDevicesSchema,
      }),
      actionSchemaByType(ACTIONS.TIME.DELAY, {
        value: z.number().optional(),
        evaluate_value: z.string().optional(),
        unit: z.enum(['milliseconds', 'seconds', 'minutes', 'hours']),
      }),
      actionSchemaByType(ACTIONS.SCENE.START, {
        scene: sceneSelectorSchema,
      }),
      actionSchemaByType(ACTIONS.MESSAGE.SEND, {
        user: userSelectorSchema,
        text: z.string(),
        service: messageServiceSchema,
      }),
      actionSchemaByType(ACTIONS.MESSAGE.SEND_CAMERA, {
        user: userSelectorSchema,
        text: z.string(),
        camera: z.string(),
        service: messageServiceSchema,
      }),
      actionSchemaByType(ACTIONS.AI.ASK, {
        user: userSelectorSchema,
        text: z
          .string()
          .describe(
            'Prompt text for AI (required). To inject values from previous "device.get-value" actions, use Handlebars variables with action coordinates, for example {{1.1.last_value}} (or {{0.0.last_value}}) and {{1.1.last_value_string}}.',
          ),
        camera: z.string().optional(),
      }),
      actionSchemaByType(ACTIONS.DEVICE.GET_VALUE, {
        device_feature: deviceFeatureSelectorSchema,
      }),
      actionSchemaByType(ACTIONS.TIME.GET_DATE, {
        precision: z
          .enum(['second', 'minute', 'hour', 'day'])
          .optional()
          .describe(
            'Precision the current date/time is truncated to. Defaults to "minute". The result is available in the next actions as {{<action coordinates>.datetime}}, {{<action coordinates>.date}}, {{<action coordinates>.time}} and {{<action coordinates>.timestamp}} (unix timestamp in seconds, usable in a formula). The timestamp is truncated to the same precision, so use "second" when a formula needs an exact date.',
          ),
      }),
      actionSchemaByType(ACTIONS.VARIABLE.SET, {
        name: z
          .string()
          .optional()
          .describe('Human readable name of the variable, only displayed in the scene editor.'),
        text: z
          .string()
          .optional()
          .describe(
            'Text value of the variable. It can contain Handlebars variables, for example {{0.0.last_value}}. Mutually exclusive with evaluate_value. The result is available in the next actions as {{<action coordinates>.value}}, for example {{1.0.value}}.',
          ),
        evaluate_value: z
          .string()
          .optional()
          .describe(
            'Formula evaluated to a number, for example {{0.0.last_value}} * 2. Mutually exclusive with text. The result is available in the next actions as {{<action coordinates>.value}}, for example {{1.0.value}}.',
          ),
      }).refine((action) => action.text === undefined || action.evaluate_value === undefined, {
        message: 'text and evaluate_value cannot be used at the same time',
      }),
      actionSchemaByType(ACTIONS.CONDITION.ONLY_CONTINUE_IF, {
        conditions: z
          .array(sceneConditionSchema)
          .min(1)
          .describe(
            'Conditions combined with OR logic: the scene continues if at least one condition is true. Use separate only-continue-if action groups in sequence for AND logic.',
          ),
      }),
      actionSchemaByType(ACTIONS.CONDITION.CHECK_TIME, {
        before: z
          .string()
          .regex(hhmmPattern)
          .optional(),
        after: z
          .string()
          .regex(hhmmPattern)
          .optional(),
        days_of_the_week: z.array(weekDaysSchema).optional(),
      }),
      actionSchemaByType(ACTIONS.SCENE.IN_TIME_RANGE, {
        in_range: z
          .boolean()
          .optional()
          .describe(
            'True (default) continues when the current time is inside one of the time ranges of the scene, false when it is outside.',
          ),
      }),
      actionSchemaByType(ACTIONS.HOUSE.IS_EMPTY, {
        house: houseSelectorSchema,
      }),
      actionSchemaByType(ACTIONS.HOUSE.IS_NOT_EMPTY, {
        house: houseSelectorSchema,
      }),
      actionSchemaByType(ACTIONS.USER.SET_SEEN_AT_HOME, {
        house: houseSelectorSchema,
        user: userSelectorSchema,
      }),
      actionSchemaByType(ACTIONS.USER.SET_OUT_OF_HOME, {
        house: houseSelectorSchema,
        user: userSelectorSchema,
      }),
      actionSchemaByType(ACTIONS.HTTP.REQUEST, {
        method: z.enum(['get', 'post', 'patch', 'put', 'delete']),
        url: z.string(),
        headers: z.array(z.object({ key: z.string(), value: z.string() }).strict()),
        body: z.string().optional(),
        request_response_keys: z.array(z.string()).optional(),
      }),
      actionSchemaByType(ACTIONS.USER.CHECK_PRESENCE, {
        user: userSelectorSchema,
        house: houseSelectorSchema,
        minutes: z.number(),
        device_features: z.array(deviceFeatureSelectorSchema).min(1),
      }),
      actionSchemaByType(ACTIONS.CALENDAR.IS_EVENT_RUNNING, {
        calendars: z.array(calendarSelectorSchema).min(1),
        calendar_event_name_comparator: calendarComparatorSchema,
        calendar_event_name: z.string().optional(),
        stop_scene_if_event_found: z.boolean().optional(),
        stop_scene_if_event_not_found: z.boolean().optional(),
      }),
      actionSchemaByType(ACTIONS.CALENDAR.GET_EVENTS, {
        calendars: z.array(calendarSelectorSchema).min(1),
        time_range: z.enum(['today', 'tomorrow', 'next-x-hours']),
        duration: z
          .number()
          .int()
          .min(1)
          .optional(),
        stop_scene_if_no_events: z.boolean().optional(),
      }).refine((action) => action.time_range !== 'next-x-hours' || typeof action.duration === 'number', {
        message: 'duration is required when time_range is next-x-hours',
        path: ['duration'],
      }),
      actionSchemaByType(ACTIONS.ECOWATT.CONDITION, {
        ecowatt_network_status: z.enum(['ok', 'warning', 'critical']),
      }),
      actionSchemaByType(ACTIONS.EDF_TEMPO.CONDITION, {
        edf_tempo_peak_day_type: z.enum(['blue', 'white', 'red', 'no-check']),
        edf_tempo_day: z.enum(['today', 'tomorrow']),
        edf_tempo_peak_hour_type: z.enum(['peak-hour', 'off-peak-hour', 'no-check']).optional(),
      }),
      actionSchemaByType(ACTIONS.ALARM.CHECK_ALARM_MODE, {
        house: houseSelectorSchema,
        alarm_mode: z.enum(ALARM_MODES_LIST),
      }),
      actionSchemaByType(ACTIONS.ALARM.SET_ALARM_MODE, {
        house: houseSelectorSchema,
        alarm_mode: z.enum(ALARM_MODES_LIST),
      }),
      actionSchemaByType(ACTIONS.MQTT.SEND, {
        topic: z.string(),
        message: z.string(),
      }),
      actionSchemaByType(ACTIONS.ZIGBEE2MQTT.SEND, {
        topic: z.string(),
        message: z.string(),
      }),
      actionSchemaByType(ACTIONS.MUSIC.PLAY_NOTIFICATION, {
        device: musicNotificationDevicesSchema,
        text: z.string(),
        volume: z
          .number()
          .int()
          .min(0)
          .max(100)
          .optional(),
        evaluate_volume: z
          .string()
          .optional()
          .describe(
            'Formula evaluated to a volume in percent, for example {{0.0.value}} * 10. Used instead of volume, and clamped between 0 and 100.',
          ),
      }),
      actionSchemaByType(ACTIONS.SMS.SEND, {
        text: z.string(),
      }),
      actionSchemaByType(ACTIONS.CONDITION.IF_THEN_ELSE, {
        if: z.array(sceneActionSchema).min(1),
        then: z.array(z.array(sceneActionSchema)),
        else: z.array(z.array(sceneActionSchema)),
      }),
      actionSchemaByType(ACTIONS.CONDITION.WHILE, {
        if: z
          .array(sceneActionSchema)
          .min(1)
          .describe('Conditions re-evaluated before each iteration. The loop stops when one of them fails.'),
        then: z.array(z.array(sceneActionSchema)).describe('Actions executed on each iteration of the loop.'),
        max_iterations: z
          .number()
          .int()
          .min(1)
          .max(10000)
          .optional()
          .describe('Safety limit for the number of iterations (default 1000).'),
      }),
    ]),
  );

  // `device.new-state` accepts either a single `device_feature` (legacy) or a non-empty
  // `device_features` array sharing the condition (the trigger fires when any matches).
  // Both variants are in the union so the schema stays strict without allowing neither.
  const deviceNewStateConditionShape = {
    operator: comparisonOperatorSchema,
    value: z
      .number()
      .describe(
        'Numeric device state to match. For binary features (lights, switches, buttons): use 1 for ON and 0 for OFF. Never use strings like "ON" or "OFF". For sensors, use the numeric threshold (for example 2400 for CO2 ppm).',
      ),
    threshold_only: z
      .boolean()
      .optional()
      .describe(
        'When true, fire only on transition into the matching state (rising edge), not while the state stays matched.',
      ),
    for_duration: z
      .number()
      .optional()
      .describe(
        'Delay in milliseconds after the condition becomes true before the trigger fires. Example: 45 minutes = 2700000.',
      ),
  };
  // "any change" mode: the trigger fires on every state change of the feature, whatever the
  // new value. There is no value to compare against, and neither `threshold_only` nor
  // `for_duration` applies to an instantaneous change, so they are not part of this shape.
  const deviceNewStateAnyChangeShape = {
    operator: z
      .literal(ANY_CHANGE_OPERATOR)
      .describe(
        'Fires on any state change of the device feature, whatever the new value. Use it instead of one trigger per possible value. No "value", "threshold_only" or "for_duration" is accepted with this operator.',
      ),
  };
  const sceneTriggerSchema = z.union([
    triggerSchemaByType(EVENTS.DEVICE.NEW_STATE, {
      device_feature: deviceFeatureSelectorSchema,
      ...deviceNewStateConditionShape,
    }),
    triggerSchemaByType(EVENTS.DEVICE.NEW_STATE, {
      device_features: z
        .array(deviceFeatureSelectorSchema)
        .min(1)
        .describe(
          'Several device features of the same type sharing one condition: the trigger fires as soon as any of them matches.',
        ),
      ...deviceNewStateConditionShape,
    }),
    triggerSchemaByType(EVENTS.DEVICE.NEW_STATE, {
      device_feature: deviceFeatureSelectorSchema,
      ...deviceNewStateAnyChangeShape,
    }),
    triggerSchemaByType(EVENTS.DEVICE.NEW_STATE, {
      device_features: z
        .array(deviceFeatureSelectorSchema)
        .min(1)
        .describe('Several device features: the trigger fires as soon as one of them changes state.'),
      ...deviceNewStateAnyChangeShape,
    }),
    triggerSchemaByType(EVENTS.TIME.CHANGED, {
      scheduler_type: z.literal('every-month'),
      day_of_the_month: z
        .number()
        .min(1)
        .max(31),
      time: z.string().regex(hhmmPattern),
      date: z.string().optional(),
      interval: z.number().optional(),
      unit: z.string().optional(),
      days_of_the_week: z.array(weekDaysSchema).optional(),
      key: z.string().optional(),
    }),
    triggerSchemaByType(EVENTS.TIME.CHANGED, {
      scheduler_type: z.literal('every-week'),
      days_of_the_week: z.array(weekDaysSchema).optional(),
      time: z.string().regex(hhmmPattern),
      date: z.string().optional(),
      interval: z.number().optional(),
      unit: z.string().optional(),
      day_of_the_month: z
        .number()
        .min(1)
        .max(31)
        .optional(),
      key: z.string().optional(),
    }),
    triggerSchemaByType(EVENTS.TIME.CHANGED, {
      scheduler_type: z.literal('every-day'),
      time: z.string().regex(hhmmPattern),
      date: z.string().optional(),
      interval: z.number().optional(),
      unit: z.string().optional(),
      days_of_the_week: z.array(weekDaysSchema).optional(),
      day_of_the_month: z
        .number()
        .min(1)
        .max(31)
        .optional(),
      key: z.string().optional(),
    }),
    triggerSchemaByType(EVENTS.TIME.CHANGED, {
      scheduler_type: z.literal('custom-time'),
      date: z.string(),
      time: z.string().regex(hhmmPattern),
      interval: z.number().optional(),
      unit: z.string().optional(),
      days_of_the_week: z.array(weekDaysSchema).optional(),
      day_of_the_month: z
        .number()
        .min(1)
        .max(31)
        .optional(),
      key: z.string().optional(),
    }),
    triggerSchemaByType(EVENTS.TIME.CHANGED, {
      scheduler_type: z.literal('time-range'),
      time_ranges: z
        .array(timeRangeSchema)
        .min(1)
        .describe('Time ranges: the scene runs at the start and at the end of each one.'),
      resume_on_startup: z
        .boolean()
        .optional()
        .describe('Also run the scene when Gladys starts, to re-apply the state of the planning.'),
      date: z.string().optional(),
      time: z
        .string()
        .regex(hhmmPattern)
        .optional(),
      interval: z.number().optional(),
      unit: z.string().optional(),
      days_of_the_week: z
        .array(weekDaysSchema)
        .min(1)
        .optional()
        .describe('Days the ranges start on. Absent means every day; an empty list is refused.'),
      day_of_the_month: z
        .number()
        .min(1)
        .max(31)
        .optional(),
      key: z.string().optional(),
    }),
    triggerSchemaByType(EVENTS.TIME.CHANGED, {
      scheduler_type: z.literal('interval'),
      interval: z.number(),
      unit: z.enum(['second', 'minute', 'hour']),
      date: z.string().optional(),
      time: z
        .string()
        .regex(hhmmPattern)
        .optional(),
      days_of_the_week: z.array(weekDaysSchema).optional(),
      day_of_the_month: z
        .number()
        .min(1)
        .max(31)
        .optional(),
      key: z.string().optional(),
    }),
    triggerSchemaByType(EVENTS.TIME.SUNRISE, {
      house: houseSelectorSchema,
      offset: z
        .number()
        .int()
        .min(-1440)
        .max(1440)
        .optional(),
    }),
    triggerSchemaByType(EVENTS.TIME.SUNSET, {
      house: houseSelectorSchema,
      offset: z
        .number()
        .int()
        .min(-1440)
        .max(1440)
        .optional(),
    }),
    triggerSchemaByType(EVENTS.USER_PRESENCE.BACK_HOME, {
      user: userSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.USER_PRESENCE.LEFT_HOME, {
      user: userSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.HOUSE.EMPTY, {
      house: houseSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.HOUSE.NO_LONGER_EMPTY, {
      house: houseSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.AREA.USER_ENTERED, {
      user: userSelectorSchema,
      area: areaSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.AREA.USER_LEFT, {
      user: userSelectorSchema,
      area: areaSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.ALARM.ARM, {
      house: houseSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.ALARM.ARMING, {
      house: houseSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.ALARM.DISARM, {
      house: houseSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.ALARM.PARTIAL_ARM, {
      house: houseSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.ALARM.PANIC, {
      house: houseSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.ALARM.TOO_MANY_CODES_TESTS, {
      house: houseSelectorSchema,
    }),
    triggerSchemaByType(EVENTS.SYSTEM.START, {}),
    triggerSchemaByType(EVENTS.MQTT.RECEIVED, {
      topic: z.string(),
      message: z.string().optional(),
    }),
    triggerSchemaByType(EVENTS.CALENDAR.EVENT_IS_COMING, {
      calendar_event_attribute: triggerCalendarEventAttributeSchema,
      calendar_event_name_comparator: calendarComparatorSchema,
      calendars: z.array(z.string()).min(1),
      calendar_event_name: z.string().optional(),
      duration: z.number().optional(),
    }),
  ]);

  return z.object({
    name: z
      .string()
      .min(1)
      .describe('Scene name.'),
    icon: z.enum(iconList).describe('Scene icon.'),
    triggers: z
      .array(sceneTriggerSchema)
      .min(1)
      .describe(
        'Required. Top-level array of when the scene starts. Put device.new-state, time.changed, time.sunrise and all other trigger types here only. Example: [{"type":"device.new-state","device_feature":"mqtt-lumiere","operator":"=","value":1,"threshold_only":true,"for_duration":2700000}]. To react to any state change of a feature, use the "changed" operator without value: [{"type":"device.new-state","device_feature":"mqtt-thermostat","operator":"changed"}]. Never put these types in actions.',
      ),
    actions: z
      .array(z.array(sceneActionSchema))
      .min(1)
      .describe(
        'Top-level array of action groups run sequentially after a trigger fires. Each inner array runs in parallel. Example: [[{"type":"delay","unit":"minutes","value":45}],[{"type":"device.get-value","device_feature":"mqtt-co2"}]]. Never put device.new-state, time.changed or other trigger types here.',
      ),
    description: z
      .string()
      .optional()
      .describe('Optional scene description.'),
    active: z
      .boolean()
      .optional()
      .describe('Optional scene active flag.'),
    selector: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional()
      .describe('Optional scene selector, kebab-case.'),
    tags: z
      .array(
        z.object({
          name: z.string().min(1),
        }),
      )
      .default([])
      .describe('Optional scene tags.'),
  });
}

/**
 * @description Extract all declared action types from raw scene payload.
 * @param {object} rawScene - Raw scene payload.
 * @returns {Array<string>} Distinct action types.
 * @example
 * extractProvidedActionTypes({ actions: [[{ type: 'ai.ask' }]] });
 */
function extractProvidedActionTypes(rawScene) {
  if (!rawScene || !Array.isArray(rawScene.actions)) {
    return [];
  }
  const flatten = (arr) =>
    arr.flatMap((item) => {
      if (Array.isArray(item)) {
        return flatten(item);
      }
      if (item && typeof item === 'object') {
        return [item];
      }
      return [];
    });
  return [
    ...new Set(
      flatten(rawScene.actions)
        .map((action) => action.type)
        .filter(Boolean),
    ),
  ];
}

/**
 * @description Recursively flatten nested union issues from Zod.
 * @param {object} issue - Zod issue object.
 * @param {Array<string|number>} [parentPath] - Parent path segments.
 * @returns {Array<{path: string, message: string}>} Flat issues list.
 * @example
 * flattenUnionIssues({ path: ['actions'], message: 'Invalid input' });
 */
function flattenUnionIssues(issue, parentPath = []) {
  if (!issue || typeof issue !== 'object') {
    return [];
  }
  const currentPath = Array.isArray(issue.path) ? [...parentPath, ...issue.path] : parentPath;

  if (Array.isArray(issue.errors)) {
    return issue.errors.flatMap((nested) => {
      if (Array.isArray(nested)) {
        return nested.flatMap((nestedIssue) => flattenUnionIssues(nestedIssue, currentPath));
      }
      return flattenUnionIssues(nested, currentPath);
    });
  }

  if (Array.isArray(issue.issues)) {
    return issue.issues.flatMap((nestedIssue) => flattenUnionIssues(nestedIssue, currentPath));
  }

  if (typeof issue.message === 'string') {
    return [
      {
        path: currentPath.join('.') || 'root',
        message: issue.message,
      },
    ];
  }
  return [];
}

/**
 * @description Format one Zod issue into actionable validation text.
 * @param {object} issue - Zod issue.
 * @param {object} rawScene - Raw scene payload submitted by model.
 * @returns {string} Human-readable issue string.
 * @example
 * formatSceneCreateZodIssue({ path: ['actions'], code: 'invalid_union', message: 'Invalid input' }, {});
 */
function formatSceneCreateZodIssue(issue, rawScene) {
  const path = issue.path.join('.') || 'root';
  if (issue.code === 'invalid_union') {
    const unionDetails = flattenUnionIssues(issue)
      .map((d) => `${d.path}: ${d.message}`)
      .filter(Boolean);
    const providedTypes = extractProvidedActionTypes(rawScene);
    const providedTypesHint =
      path === 'actions' && providedTypes.length > 0 ? ` Provided action types: ${providedTypes.join(', ')}.` : '';

    if (unionDetails.length > 0) {
      return `${path}: ${issue.message}. Details: ${unionDetails.join(' | ')}${providedTypesHint}`;
    }
  }

  return `${path}: ${issue.message}`;
}

const SCENE_CREATE_TOOL_DESCRIPTION =
  'Create a new home automation scene. The payload MUST have two separate top-level arrays: triggers (when the scene starts) and actions (what the scene does). NEVER put device.new-state, time.changed, time.sunrise or any trigger type inside actions. device.new-state belongs in triggers with numeric value (1=ON, 0=OFF). actions is nested groups only: [[group1],[group2]]. Example: {"name":"Switchbeau de ville","icon":"droplet","triggers":[{"type":"device.new-state","device_feature":"mqtt-lumiere","operator":"=","value":1,"threshold_only":true,"for_duration":2700000}],"actions":[[{"type":"delay","unit":"minutes","value":45}],[{"type":"device.get-value","device_feature":"mqtt-co2"}],[{"type":"condition.only-continue-if","conditions":[{"variable":"1.0.last_value","operator":">","value":2400}]}],[{"type":"light.turn-off","devices":["mqtt-lumiere"]}]]}';

module.exports = {
  createSceneCreateInputSchema,
  formatSceneCreateZodIssue,
  extractProvidedActionTypes,
  flattenUnionIssues,
  SCENE_CREATE_TOOL_DESCRIPTION,
  SCENE_TRIGGER_TYPES,
  flattenSceneActions,
  assertTriggerTypesNotInActions,
};
