const z = require('zod/v4');
const iconList = require('../../../config/icons.json');
const { ACTIONS, EVENTS, ALARM_MODES_LIST } = require('../../../utils/constants');

const noRoom = {
  id: null,
  name: 'No room',
  selector: 'no-room',
};

const ONE_HOUR_IN_MINUTES = 60;
const TWELVE_HOURS_IN_MINUTES = 12 * 60;
const ONE_DAY_IN_MINUTES = 24 * 60;
const SEVEN_DAYS_IN_MINUTES = 7 * 24 * 60;
const THIRTY_DAYS_IN_MINUTES = 30 * 24 * 60;
const THREE_MONTHS_IN_MINUTES = 3 * 30 * 24 * 60;
const ONE_YEAR_IN_MINUTES = 365 * 24 * 60;

const intervalByName = {
  'last-hour': ONE_HOUR_IN_MINUTES,
  'last-twelve-hours': TWELVE_HOURS_IN_MINUTES,
  'last-day': ONE_DAY_IN_MINUTES,
  'last-week': SEVEN_DAYS_IN_MINUTES,
  'last-month': THIRTY_DAYS_IN_MINUTES,
  'last-three-months': THREE_MONTHS_IN_MINUTES,
  'last-year': ONE_YEAR_IN_MINUTES,
};
const hhmmPattern = /^([0-9]{2}):([0-9]{2})$/;

const weekDaysSchema = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
const comparisonOperatorSchema = z.enum(['=', '!=', '>', '>=', '<', '<=']);
const calendarComparatorSchema = z.enum(['is-exactly', 'contains', 'starts-with', 'ends-with', 'has-any-name']);
const triggerCalendarEventAttributeSchema = z.enum(['start', 'end']);

const sceneConditionSchema = z
  .object({
    variable: z.string(),
    operator: comparisonOperatorSchema,
    value: z.union([z.number(), z.string()]).optional(),
    evaluate_value: z.string().optional(),
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
 * @param {Array<string>} userSelectors - Allowed user selectors.
 * @param {Array<string>} houseSelectors - Allowed house selectors.
 * @param {Array<string>} lightDeviceSelectors - Allowed light device selectors.
 * @param {Array<string>} deviceFeatureSelectors - Allowed device feature selectors.
 * @returns {object} Scene creation Zod schema.
 * @example
 * createSceneCreateInputSchema(['john'], ['main-house'], ['light-1'], ['sensor-1']);
 */
function createSceneCreateInputSchema(
  userSelectors = [],
  houseSelectors = [],
  lightDeviceSelectors = [],
  deviceFeatureSelectors = [],
) {
  const userSelectorSchema = userSelectors.length > 0 ? z.enum(userSelectors) : z.string();
  const houseSelectorSchema = houseSelectors.length > 0 ? z.enum(houseSelectors) : z.string();
  const lightDevicesSchema =
    lightDeviceSelectors.length > 0 ? z.array(z.enum(lightDeviceSelectors)) : z.array(z.string());
  const deviceFeatureSelectorSchema = deviceFeatureSelectors.length > 0 ? z.enum(deviceFeatureSelectors) : z.string();
  const sceneActionSchema = z.lazy(() =>
    z.discriminatedUnion('type', [
      actionSchemaByType(ACTIONS.DEVICE.SET_VALUE, {
        device_feature: z.string().optional(),
        device: z.string().optional(),
        feature_category: z.string().optional(),
        feature_type: z.string().optional(),
        value: z.number().optional(),
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
        devices: z.array(z.string()),
      }),
      actionSchemaByType(ACTIONS.SWITCH.TURN_OFF, {
        devices: z.array(z.string()),
      }),
      actionSchemaByType(ACTIONS.SWITCH.TOGGLE, {
        devices: z.array(z.string()),
      }),
      actionSchemaByType(ACTIONS.TIME.DELAY, {
        value: z.number().optional(),
        evaluate_value: z.string().optional(),
        unit: z.enum(['milliseconds', 'seconds', 'minutes', 'hours']),
      }),
      actionSchemaByType(ACTIONS.SCENE.START, {
        scene: z.string(),
      }),
      actionSchemaByType(ACTIONS.MESSAGE.SEND, {
        user: userSelectorSchema,
        text: z.string(),
      }),
      actionSchemaByType(ACTIONS.MESSAGE.SEND_CAMERA, {
        user: userSelectorSchema,
        text: z.string(),
        camera: z.string(),
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
      actionSchemaByType(ACTIONS.CONDITION.ONLY_CONTINUE_IF, {
        conditions: z.array(sceneConditionSchema).min(1),
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
      actionSchemaByType(ACTIONS.HOUSE.IS_EMPTY, {
        house: z.string(),
      }),
      actionSchemaByType(ACTIONS.HOUSE.IS_NOT_EMPTY, {
        house: z.string(),
      }),
      actionSchemaByType(ACTIONS.USER.SET_SEEN_AT_HOME, {
        house: z.string(),
        user: userSelectorSchema,
      }),
      actionSchemaByType(ACTIONS.USER.SET_OUT_OF_HOME, {
        house: z.string(),
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
        house: z.string(),
        minutes: z.number(),
        device_features: z.array(z.string()).min(1),
      }),
      actionSchemaByType(ACTIONS.CALENDAR.IS_EVENT_RUNNING, {
        calendars: z.array(z.string()).min(1),
        calendar_event_name_comparator: calendarComparatorSchema,
        calendar_event_name: z.string().optional(),
        stop_scene_if_event_found: z.boolean().optional(),
        stop_scene_if_event_not_found: z.boolean().optional(),
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
        house: z.string(),
        alarm_mode: z.enum(ALARM_MODES_LIST),
      }),
      actionSchemaByType(ACTIONS.ALARM.SET_ALARM_MODE, {
        house: z.string(),
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
        device: z.string(),
        text: z.string(),
        volume: z
          .number()
          .int()
          .min(0)
          .max(100)
          .optional(),
      }),
      actionSchemaByType(ACTIONS.SMS.SEND, {
        text: z.string(),
      }),
      actionSchemaByType(ACTIONS.CONDITION.IF_THEN_ELSE, {
        if: z.array(sceneActionSchema).min(1),
        then: z.array(z.array(sceneActionSchema)),
        else: z.array(z.array(sceneActionSchema)),
      }),
    ]),
  );

  const sceneTriggerSchema = z.union([
    triggerSchemaByType(EVENTS.DEVICE.NEW_STATE, {
      device_feature: z.string(),
      operator: comparisonOperatorSchema,
      value: z.union([z.number(), z.string()]),
      threshold_only: z.boolean().optional(),
      for_duration: z.number().optional(),
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
      house: z.string(),
    }),
    triggerSchemaByType(EVENTS.HOUSE.NO_LONGER_EMPTY, {
      house: z.string(),
    }),
    triggerSchemaByType(EVENTS.AREA.USER_ENTERED, {
      user: userSelectorSchema,
      area: z.string(),
    }),
    triggerSchemaByType(EVENTS.AREA.USER_LEFT, {
      user: userSelectorSchema,
      area: z.string(),
    }),
    triggerSchemaByType(EVENTS.ALARM.ARM, {
      house: z.string(),
    }),
    triggerSchemaByType(EVENTS.ALARM.ARMING, {
      house: z.string(),
    }),
    triggerSchemaByType(EVENTS.ALARM.DISARM, {
      house: z.string(),
    }),
    triggerSchemaByType(EVENTS.ALARM.PARTIAL_ARM, {
      house: z.string(),
    }),
    triggerSchemaByType(EVENTS.ALARM.PANIC, {
      house: z.string(),
    }),
    triggerSchemaByType(EVENTS.ALARM.TOO_MANY_CODES_TESTS, {
      house: z.string(),
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
    triggers: z
      .array(sceneTriggerSchema)
      .default([])
      .describe('Scene triggers.'),
    actions: z
      .union([z.array(z.array(sceneActionSchema)).min(1), z.array(sceneActionSchema).min(1)])
      .describe('Scene actions as nested groups.'),
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
 * @param {Array<string|number>} parentPath - Parent path segments.
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

/**
 * @description Get all resources (room and devices) available for the MCP service.
 * @returns {Promise<Array>} Array of resources with home schema configuration.
 * @example
 * getAllResources()
 */
async function getAllResources() {
  const homeSchema = {};

  const rooms = (await this.gladys.room.getAll()).map(({ selector }) => selector);
  rooms.push(noRoom.selector);
  rooms.forEach((room) => {
    homeSchema[room] = {
      devices: {},
    };
  });

  const allDevices = await this.gladys.device.get();
  const sensorDevices = allDevices
    .filter((device) => {
      return device.features.some((feature) => this.isSensorFeature(feature));
    })
    .map((device) => ({
      ...device,
      features: device.features.filter((feature) => this.isSensorFeature(feature)),
    }));

  sensorDevices.forEach((device) => {
    const d = {
      name: device.name,
      selector: device.selector,
      features: device.features.map((feature) => ({
        name: feature.name,
        selector: feature.selector,
        category: feature.category,
        type: feature.type,
        access: ['read'],
      })),
    };

    homeSchema[device.room?.selector || noRoom.selector].devices[device.selector] = d;
  });

  const switchableDevices = allDevices
    .filter((device) => {
      return device.features.some((feature) => this.isSwitchableFeature(feature));
    })
    .map((device) => ({
      ...device,
      features: device.features.filter((feature) => this.isSwitchableFeature(feature)),
    }));

  switchableDevices.forEach((device) => {
    const d = {
      name: device.name,
      selector: device.selector,
      features: device.features.map((feature) => ({
        name: feature.name,
        selector: feature.selector,
        category: feature.category,
        type: feature.type,
        access: ['write', 'read'],
      })),
    };

    if (homeSchema[device.room?.selector || noRoom.selector].devices[device.selector]?.name) {
      homeSchema[device.room?.selector || noRoom.selector].devices[device.selector].features.push(...d.features);

      return;
    }

    homeSchema[device.room?.selector || noRoom.selector].devices[device.selector] = d;
  });

  return [
    {
      name: 'home',
      uri: 'schema://home',
      config: {
        title: 'Home devices and rooms structure',
        description: 'Structure of home by room with all their devices and associated features.',
        mimeType: 'application/json',
      },
      cb: async (uri) => ({
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(homeSchema),
          },
        ],
      }),
    },
  ];
}

/**
 * @description Get all tools available in the MCP service.
 * @returns {Promise<Array>} Array of tools with their intent and configuration.
 * @example
 * getAllTools()
 */
async function getAllTools() {
  const rooms = (await this.gladys.room.getAll()).map(({ id, name, selector }) => ({ id, name, selector }));
  rooms.push(noRoom);
  const scenes = (await this.gladys.scene.get()).map(({ id, name, selector }) => ({ id, name, selector }));
  const users = (await this.gladys.user.get()).map(({ id, name, selector }) => ({ id, name, selector }));
  const houses = (await this.gladys.house.get()).map(({ id, name, selector }) => ({ id, name, selector }));

  const allDevices = await this.gladys.device.get();
  const sensorDevices = allDevices
    .filter((device) => {
      return device.features.some((feature) => this.isSensorFeature(feature));
    })
    .map((device) => ({
      ...device,
      name: device.name,
      features: device.features.filter((feature) => this.isSensorFeature(feature)),
    }));
  const availableSensorFeatureCategories = [
    ...new Set(
      sensorDevices
        .map((device) => {
          return device.features.map((feature) => feature.category);
        })
        .flat(),
    ),
  ];

  const switchableDevices = allDevices
    .filter((device) => {
      return device.features.some((feature) => this.isSwitchableFeature(feature));
    })
    .map((device) => ({
      ...device,
      name: device.name,
      features: device.features.filter((feature) => this.isSwitchableFeature(feature)),
    }));
  const availableSwitchableFeatureCategories = [
    ...new Set(
      switchableDevices
        .map((device) => {
          return device.features.map((feature) => feature.category);
        })
        .flat(),
    ),
  ];
  const deviceFeatureSelectors = allDevices
    .map((device) => device.features.map((feature) => feature.selector))
    .flat()
    .filter(Boolean);
  const lightDeviceSelectors = switchableDevices
    .filter((device) => device.features.some((feature) => feature.category === 'light' && feature.type === 'binary'))
    .map((device) => device.selector);
  const sceneCreateInputSchema = createSceneCreateInputSchema(
    users.map(({ selector }) => selector),
    houses.map(({ selector }) => selector),
    lightDeviceSelectors,
    deviceFeatureSelectors,
  );

  const historyDevices = allDevices
    .filter((device) => {
      return device.features.some((feature) => this.isHistoryFeature(feature));
    })
    .map((device) => ({
      ...device,
      name: device.name,
      features: device.features.filter((feature) => this.isHistoryFeature(feature)),
    }));
  const availableHistoryFeature = [
    ...new Set(
      historyDevices
        .map((device) => {
          return device.features.map((feature) => `${feature.category}:${feature.type}`);
        })
        .flat(),
    ),
  ];

  return [
    {
      intent: 'camera.get-image',
      config: {
        title: 'Get image from camera',
        description: 'Get image from camera in specific room.',
        inputSchema: {
          room: z.enum(rooms.map(({ name }) => name)).describe('Room to get image from.'),
        },
      },
      cb: async ({ room }) => {
        const { id } = this.findBySimilarity(rooms, room);

        const images = await this.gladys.device.camera.getImagesInRoom(id);

        return {
          content: images.map((image) => ({
            type: 'image',
            data: image.split(',')[1], // Base64 data
            mimeType: 'image/jpeg',
          })),
        };
      },
    },
    {
      intent: 'scene.create',
      config: {
        title: 'Create scene',
        description:
          'Create a new home automation scene with triggers and nested actions. Use this tool whenever the user asks to create a scene. A scene is created only if this tool succeeds. For monitoring use cases, build a periodic trigger and an ai.ask action. ai.ask requires both user and text, and text can inject previous action values like {{1.1.last_value}}. Actions inside the same group run in parallel: if one action depends on another output (for example ai.ask using device.get-value), put them in successive groups.',
        inputSchema: sceneCreateInputSchema.shape,
      },
      cb: async (scene) => {
        try {
          const parsedScene = sceneCreateInputSchema.parse(scene);
          const normalizedActions = Array.isArray(parsedScene.actions?.[0])
            ? parsedScene.actions
            : parsedScene.actions.map((action) => [action]);
          const createdScene = await this.gladys.scene.create({
            ...parsedScene,
            actions: normalizedActions,
          });

          return {
            content: [
              {
                type: 'text',
                text: this.toon({
                  id: createdScene.id,
                  name: createdScene.name,
                  selector: createdScene.selector,
                }),
              },
            ],
          };
        } catch (e) {
          if (e?.name === 'ZodError') {
            const details = e.issues.map((issue) => formatSceneCreateZodIssue(issue, scene)).join('; ');
            throw new Error(`scene.create validation failed (422): ${details}`);
          }
          if (e?.name === 'SequelizeValidationError') {
            const details = (e.errors || []).map((error) => error.message).join('; ');
            throw new Error(`scene.create failed (422): ${details || e.message}`);
          }
          throw e;
        }
      },
    },
    {
      intent: 'scene.start',
      config: {
        title: 'Start scene',
        description: 'Start a home automation scene.',
        inputSchema: {
          scene: z.enum(scenes.map(({ name }) => name)).describe('Scene name to start.'),
        },
      },
      cb: async ({ scene }) => {
        const classification = {
          intent: 'scene.start',
        };

        if (scene) {
          const { selector } = this.findBySimilarity(scenes, scene);
          classification.entities = [{ entity: 'scene', option: selector, sourceText: scene }];
        }

        this.gladys.event.emit(`intent.scene.start`, undefined, classification, {});

        return {
          content: [{ type: 'text', text: 'scene.start command sent' }],
        };
      },
    },
    {
      intent: 'device.get-state',
      config: {
        title: 'Get states from devices',
        description: 'Get last state of specific device type or in a specific room.',
        inputSchema: {
          room: z
            .enum(rooms.map(({ name }) => name))
            .optional()
            .describe('Room to get information from, leave empty to select multiple rooms.'),
          device_type: z
            .enum([...new Set([...availableSensorFeatureCategories, ...availableSwitchableFeatureCategories])])
            .optional()
            .describe('Type of device to query, leave empty to retrieve all devices.'),
        },
      },
      cb: async ({ room, device_type: deviceType }) => {
        const states = [];

        let selectedDevices = [...sensorDevices, ...switchableDevices];

        if (room && room !== '') {
          const { selector } = this.findBySimilarity(rooms, room);
          selectedDevices = selectedDevices.filter((d) => (d.room?.selector || noRoom.selector) === selector);
        }

        if (deviceType && deviceType.length > 0) {
          selectedDevices = selectedDevices.filter((device) => {
            return device.features.some((feature) => deviceType.includes(feature.category));
          });
        }

        await Promise.all(
          selectedDevices.map(async (device) => {
            const deviceLastState = await this.gladys.device.getBySelector(device.selector);
            return device.features.map((feature) => {
              if (!deviceType || deviceType.length === 0 || deviceType.includes(feature.category)) {
                const featureLastState = deviceLastState.features.find((feat) => feat.id === feature.id);

                states.push({
                  room: device.room?.name || noRoom.name,
                  device: device.name,
                  feature: featureLastState.name,
                  category: featureLastState.category,
                  ...this.formatValue(featureLastState),
                });

                return true;
              }

              return false;
            });
          }),
        );

        return {
          content: [
            {
              type: 'text',
              text: this.toon(states),
            },
          ],
        };
      },
    },
    {
      intent: 'device.turn-on-off',
      config: {
        title: 'Turn on/off devices',
        description:
          'Turn on/off specific device selected either by the name if we know it else by it room and it device type.',
        inputSchema: {
          action: z.enum(['on', 'off']).describe('Action to perform on the device.'),
          device: z
            .enum([...new Set(switchableDevices.map(({ name }) => name))])
            .describe('Device name to turn on/off.')
            .optional(),
          room: z
            .enum(rooms.map(({ name }) => name))
            .describe("Device's room if specified, required if device_category is specified.")
            .optional(),
          device_category: z
            .enum(availableSwitchableFeatureCategories)
            .describe('Type of device to turn on/off only if user has not specified device name.')
            .optional(),
        },
      },
      cb: async ({ action, device, room, device_category: deviceCategory }) => {
        const actionValue = action;
        let selectedDevices = switchableDevices;

        if (room && room !== '') {
          const { selector } = this.findBySimilarity(rooms, room);
          selectedDevices = selectedDevices.filter((d) => (d.room?.selector || noRoom.selector) === selector);
        }

        if (device) {
          const selectedDevice = this.findBySimilarity(selectedDevices, device);
          if (selectedDevice?.name) {
            await Promise.all(
              selectedDevice.features.map((f) => {
                return this.gladys.device.setValue(selectedDevice, f, actionValue === 'on' ? 1 : 0);
              }),
            );

            return {
              content: [{ type: 'text', text: `device.turn-${actionValue} command sent for ${selectedDevice.name}` }],
            };
          }
        }

        if (room && deviceCategory) {
          selectedDevices = selectedDevices.filter((d) => d.features.some((f) => f.category === deviceCategory));

          if (selectedDevices.length > 0) {
            await Promise.all(
              selectedDevices.map((d) => {
                return Promise.all(
                  d.features.map((f) => {
                    if (f.category === deviceCategory) {
                      return this.gladys.device.setValue(d, f, actionValue === 'on' ? 1 : 0);
                    }

                    return null;
                  }),
                );
              }),
            );

            return {
              content: [
                {
                  type: 'text',
                  text: `device.turn-${actionValue} command sent for devices in room ${room} with category ${deviceCategory}`,
                },
              ],
            };
          }
        }

        return {
          content: [{ type: 'text', text: `device.turn-${actionValue} command not sent, no device found` }],
        };
      },
    },
    {
      intent: 'device.get-history',
      config: {
        title: 'Get device history',
        description: 'Get history states of specific device.',
        inputSchema: {
          room: z
            .enum(rooms.map(({ name }) => name))
            .describe('Room to get information from.')
            .optional(),
          device: z
            .enum([...new Set(historyDevices.map(({ name }) => name))])
            .describe('Device name to get history.')
            .optional(),
          feature: z
            .enum(availableHistoryFeature)
            .describe('Type of device to query.')
            .optional(),
          interval: z
            .enum(Object.keys(intervalByName))
            .describe('Time interval to get history from.')
            .optional(),
        },
      },
      cb: async ({ room, device, feature, interval }) => {
        let selectedDevices = historyDevices;

        if (room && room !== '') {
          const { selector } = this.findBySimilarity(rooms, room);
          selectedDevices = selectedDevices.filter((d) => (d.room?.selector || noRoom.selector) === selector);
        }

        if (feature && feature !== '') {
          const [featureCategory, featureType] = feature.split(':');
          selectedDevices = selectedDevices.filter((d) => {
            return d.features.some(
              (f) => f.category === featureCategory && (featureType ? f.type === featureType : true),
            );
          });
        }

        if (device && device !== '') {
          const deviceFound = this.findBySimilarity(selectedDevices, device);
          if (deviceFound?.name) {
            selectedDevices = [deviceFound];
          }
        }

        if (selectedDevices.length > 0) {
          const selectedFeature =
            selectedDevices[0].features.find((f) => {
              if (feature && feature !== '') {
                const [featureCategory, featureType] = feature.split(':');

                return f.category === featureCategory && (featureType ? f.type === featureType : true);
              }

              return false;
            }) || selectedDevices[0].features[0];

          const aggStates = await this.gladys.device.getDeviceFeaturesAggregates(
            selectedFeature.selector,
            interval ? intervalByName[interval] : THIRTY_DAYS_IN_MINUTES,
            500,
          );
          aggStates.values = aggStates.values.map((v) => {
            let decimalPlaces;
            if (typeof v.value === 'number') {
              decimalPlaces = Math.max(
                v.min_value?.toString().split('.')[1]?.length || 2,
                v.max_value?.toString().split('.')[1]?.length || 2,
              );
            }

            return {
              ...v,
              ...(decimalPlaces && {
                value: Number(v.value.toFixed(decimalPlaces)),
                sum_value: Number(v.sum_value.toFixed(decimalPlaces)),
              }),
            };
          });

          return {
            content: [
              {
                type: 'text',
                text: this.toon({
                  room: selectedDevices[0].room?.name || noRoom.name,
                  device: selectedDevices[0].name,
                  feature: selectedFeature.name,
                  category: selectedFeature.category,
                  type: selectedFeature.type,
                  unit: this.formatValue(selectedFeature).unit,
                  values: aggStates.values,
                }),
              },
            ],
          };
        }

        return {
          content: [{ type: 'text', text: `device.get-history, no device or feature found` }],
        };
      },
    },
  ];
}

module.exports = {
  getAllResources,
  getAllTools,
  extractProvidedActionTypes,
  flattenUnionIssues,
};
