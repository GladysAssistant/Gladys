const z = require('zod/v4');
const {
  SYSTEM_VARIABLE_NAMES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  COVER_STATE,
  AI_CHAT_TOOL_CATEGORIES,
  WEATHER_UNITS,
} = require('../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { normalize } = require('../../../utils/device');
const { hexToInt, kelvinToMired } = require('../../../utils/colors');
const {
  createSceneCreateInputSchema,
  formatSceneCreateZodIssue,
  extractProvidedActionTypes,
  flattenUnionIssues,
  SCENE_CREATE_TOOL_DESCRIPTION,
  assertTriggerTypesNotInActions,
} = require('./sceneSchemas');
const { fetchWebPage } = require('./webRequest');
const { compareTimes } = require('./compareTimes');
const { formatWeather } = require('./formatWeather');

const DEFAULT_TIMEZONE = 'Europe/Paris';

const noRoom = {
  id: null,
  name: 'No room',
  selector: 'no-room',
};

const ONE_HOUR_IN_MINUTES = 60;
const TWELVE_HOURS_IN_MINUTES = 12 * 60;
const ONE_DAY_IN_MINUTES = 24 * 60;
const THREE_DAYS_IN_MINUTES = 3 * 24 * 60;
const SEVEN_DAYS_IN_MINUTES = 7 * 24 * 60;
const THIRTY_DAYS_IN_MINUTES = 30 * 24 * 60;
const THREE_MONTHS_IN_MINUTES = 3 * 30 * 24 * 60;
const ONE_YEAR_IN_MINUTES = 365 * 24 * 60;

const intervalByName = {
  'last-hour': ONE_HOUR_IN_MINUTES,
  'last-twelve-hours': TWELVE_HOURS_IN_MINUTES,
  'last-day': ONE_DAY_IN_MINUTES,
  'last-three-days': THREE_DAYS_IN_MINUTES,
  'last-week': SEVEN_DAYS_IN_MINUTES,
  'last-month': THIRTY_DAYS_IN_MINUTES,
  'last-three-months': THREE_MONTHS_IN_MINUTES,
  'last-year': ONE_YEAR_IN_MINUTES,
};

/**
 * @description Resolve a device type sent by the model to the feature categories of this home.
 * @param {string} requestedType - Device type as sent by the model.
 * @param {Array<string>} availableDeviceTypes - Feature categories available in this home.
 * @returns {Array<string>} Matching feature categories, or the requested type when nothing matches.
 * @example
 * resolveDeviceTypes('temperature', ['temperature-sensor']);
 */
function resolveDeviceTypes(requestedType, availableDeviceTypes) {
  const normalized = String(requestedType)
    .trim()
    .toLowerCase();

  const exactMatch = availableDeviceTypes.find((category) => category.toLowerCase() === normalized);
  if (exactMatch) {
    return [exactMatch];
  }

  // Models routinely drop the category suffix and ask for "temperature" instead of
  // "temperature-sensor". Several categories can share a prefix ("energy-sensor" and
  // "energy-production-sensor"), so keep them all instead of silently picking whichever
  // comes first. Returning the requested type untouched when nothing matches keeps
  // "this category does not exist in this home" a distinct outcome.
  const prefixMatches = availableDeviceTypes.filter((category) => category.toLowerCase().startsWith(`${normalized}-`));
  if (prefixMatches.length > 0) {
    return prefixMatches;
  }

  return [requestedType];
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
        access: this.isWritableSensorFeature(feature, device) ? ['write', 'read'] : ['read'],
      })),
    };

    homeSchema[device.room?.selector || noRoom.selector].devices[device.selector] = d;
  });

  const textDevices = allDevices
    .filter((device) => {
      return device.features.some((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.TEXT);
    })
    .map((device) => ({
      ...device,
      features: device.features.filter((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.TEXT),
    }));

  textDevices.forEach((device) => {
    const d = {
      name: device.name,
      selector: device.selector,
      features: device.features.map((feature) => ({
        name: feature.name,
        selector: feature.selector,
        category: feature.category,
        type: feature.type,
        access: this.isWritableSensorFeature(feature, device) ? ['write', 'read'] : ['read'],
      })),
    };

    if (homeSchema[device.room?.selector || noRoom.selector].devices[device.selector]?.name) {
      homeSchema[device.room?.selector || noRoom.selector].devices[device.selector].features.push(...d.features);

      return;
    }

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

  const lightControlDevices = allDevices
    .filter((device) => {
      return device.features.some((feature) => this.isLightControlFeature(feature));
    })
    .map((device) => ({
      ...device,
      features: device.features.filter((feature) => this.isLightControlFeature(feature)),
    }));

  lightControlDevices.forEach((device) => {
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

  const shutterDevices = allDevices
    .filter((device) => {
      return device.features.some((feature) => this.isShutterFeature(feature));
    })
    .map((device) => ({
      ...device,
      features: device.features.filter((feature) => this.isShutterFeature(feature)),
    }));

  shutterDevices.forEach((device) => {
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
 * @param {string} [userId] - Optional user id used to scope private calendars.
 * @returns {Promise<Array>} Array of tools with their intent and configuration.
 * @example
 * getAllTools('0cd30aef-9c4e-4a23-88e3-3547971296e5')
 */
async function getAllTools(userId) {
  const rooms = (await this.gladys.room.getAll()).map(({ id, name, selector, house_id: houseId }) => ({
    id,
    name,
    selector,
    house_id: houseId,
  }));
  rooms.push(noRoom);
  const scenes = (await this.gladys.scene.get()).map(({ id, name, selector }) => ({ id, name, selector }));
  const users = (await this.gladys.user.get()).map(({ id, name, selector }) => ({ id, name, selector }));
  const allHouses = await this.gladys.house.get();
  const houses = allHouses.map(({ id, name, selector }) => ({ id, name, selector }));
  // Weather is fetched from coordinates: a house without them has no weather to
  // report, and the tool is not exposed at all rather than failing at call time.
  const housesWithCoordinates = allHouses
    .filter(({ latitude, longitude }) => Number.isFinite(latitude) && Number.isFinite(longitude))
    .map(({ id, name, selector, latitude, longitude }) => ({ id, name, selector, latitude, longitude }));
  const calendars = userId
    ? (await this.gladys.calendar.get(userId)).map(({ id, name, selector }) => ({ id, name, selector }))
    : [];
  const areas = (await this.gladys.area.get()).map(({ id, name, selector }) => ({ id, name, selector }));

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
  const lightControlDevices = allDevices
    .filter((device) => {
      return device.features.some((feature) => this.isLightControlFeature(feature));
    })
    .map((device) => ({
      ...device,
      name: device.name,
      features: device.features.filter((feature) => this.isLightControlFeature(feature)),
    }));
  const availableLightControlFeatureCategories = [
    ...new Set(
      lightControlDevices
        .map((device) => {
          return device.features.map((feature) => feature.category);
        })
        .flat(),
    ),
  ];
  const shutterDevices = allDevices
    .filter((device) => {
      return device.features.some((feature) => this.isShutterFeature(feature));
    })
    .map((device) => ({
      ...device,
      name: device.name,
      features: device.features.filter((feature) => this.isShutterFeature(feature)),
    }));
  const availableShutterFeatureCategories = [
    ...new Set(
      shutterDevices
        .map((device) => {
          return device.features.map((feature) => feature.category);
        })
        .flat(),
    ),
  ];
  const availableDeviceTypes = [
    ...new Set([
      ...availableSensorFeatureCategories,
      ...availableSwitchableFeatureCategories,
      ...availableLightControlFeatureCategories,
      ...availableShutterFeatureCategories,
    ]),
  ];
  const deviceFeatureSelectors = allDevices
    .map((device) => device.features.map((feature) => feature.selector))
    .flat()
    .filter(Boolean);
  const lightDeviceSelectors = switchableDevices
    .filter((device) => device.features.some((feature) => feature.category === 'light' && feature.type === 'binary'))
    .map((device) => device.selector);
  const switchDeviceSelectors = switchableDevices
    .filter((device) => device.features.some((feature) => feature.category === 'switch' && feature.type === 'binary'))
    .map((device) => device.selector);
  const musicNotificationDeviceSelectors = allDevices
    .filter((device) =>
      device.features.some((feature) => feature.category === 'music' && feature.type === 'play_notification'),
    )
    .map((device) => device.selector);
  const sceneCreateInputSchema = createSceneCreateInputSchema(
    scenes.map(({ selector }) => selector),
    users.map(({ selector }) => selector),
    houses.map(({ selector }) => selector),
    lightDeviceSelectors,
    switchDeviceSelectors,
    musicNotificationDeviceSelectors,
    deviceFeatureSelectors,
    calendars.map(({ selector }) => selector),
    areas.map(({ selector }) => selector),
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
  const writableSensorDevices = allDevices
    .filter((device) => device.features.some((feature) => this.isWritableSensorFeature(feature, device)))
    .map((device) => ({
      ...device,
      features: device.features.filter((feature) => this.isWritableSensorFeature(feature, device)),
    }));

  const batteryDevices = allDevices
    .filter((device) => {
      return device.features.some((feature) => this.isBatteryFeature(feature));
    })
    .map((device) => ({
      ...device,
      name: device.name,
      features: device.features.filter((feature) => this.isBatteryFeature(feature)),
    }));

  const isEnergyMonitoringFeature = (feature) =>
    feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
    [
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
    ].includes(feature.type);
  const energyMonitoringDevices = allDevices
    .filter((device) => device.features.some(isEnergyMonitoringFeature))
    .map((device) => ({
      ...device,
      name: device.name,
      features: device.features.filter(isEnergyMonitoringFeature),
    }));

  const tools = [
    {
      intent: 'camera.get-image',
      config: {
        title: 'Get image from camera',
        description: 'Get image from camera in specific room.',
        categories: [AI_CHAT_TOOL_CATEGORIES.DEVICE_QUERY, AI_CHAT_TOOL_CATEGORIES.OTHER],
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
        description: SCENE_CREATE_TOOL_DESCRIPTION,
        categories: [AI_CHAT_TOOL_CATEGORIES.SCENES],
        inputSchema: sceneCreateInputSchema.shape,
      },
      cb: async (scene) => {
        try {
          assertTriggerTypesNotInActions(scene);
          const parsedScene = sceneCreateInputSchema.parse(scene);
          const createdScene = await this.gladys.scene.create({
            ...parsedScene,
            actions: parsedScene.actions,
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
        categories: [
          AI_CHAT_TOOL_CATEGORIES.SCENES,
          AI_CHAT_TOOL_CATEGORIES.DEVICE_CONTROL,
          AI_CHAT_TOOL_CATEGORIES.OTHER,
        ],
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
        categories: [
          AI_CHAT_TOOL_CATEGORIES.SCENES,
          AI_CHAT_TOOL_CATEGORIES.DEVICE_CONTROL,
          AI_CHAT_TOOL_CATEGORIES.DEVICE_QUERY,
          AI_CHAT_TOOL_CATEGORIES.OTHER,
        ],
        inputSchema: {
          room: z
            .enum(rooms.map(({ name }) => name))
            .optional()
            .describe(
              'Room to get information from. Only a room name from the list is accepted, ' +
                'leave empty to cover the whole home.',
            ),
          device_type: z
            .enum(availableDeviceTypes)
            .optional()
            .describe('Type of device to query, leave empty to retrieve all devices.'),
        },
      },
      cb: async ({ room, device_type: deviceType }) => {
        const states = [];

        let selectedDevices = [...sensorDevices, ...switchableDevices, ...lightControlDevices, ...shutterDevices];
        let scopeLabel = '';

        // The chat gateway runs this callback with the raw arguments produced by the
        // model, which is not bound by the enums above. "Températures de la maison"
        // makes it pass the house as a room: that used to resolve to no selector at
        // all, filter every device out, and the empty result then reads as "no
        // temperature sensor is configured at home".
        if (room && room !== '') {
          const selectedRoom = this.findBySimilarity(rooms, room);

          if (selectedRoom?.selector) {
            selectedDevices = selectedDevices.filter(
              (d) => (d.room?.selector || noRoom.selector) === selectedRoom.selector,
            );
            scopeLabel = ` in room "${selectedRoom.name}"`;
          } else {
            const selectedHouse = this.findBySimilarity(houses, room);

            if (selectedHouse?.id) {
              // A house is the whole home, not a room: keep every device of its rooms,
              // plus the devices that are not assigned to a room.
              const houseRoomSelectors = rooms
                .filter((r) => r.house_id === selectedHouse.id)
                .map(({ selector }) => selector);
              selectedDevices = selectedDevices.filter(
                (d) => !d.room?.selector || houseRoomSelectors.includes(d.room.selector),
              );
              scopeLabel = ` in house "${selectedHouse.name}"`;
            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text:
                      `device.get-state: "${room}" is not a room of this home, no state was read. ` +
                      // "No room" is the sentinel holding the devices that were never assigned
                      // to a room, not a room the model should be invited to retry with.
                      `Available rooms: ${rooms
                        .filter(({ selector }) => selector !== noRoom.selector)
                        .map(({ name }) => name)
                        .join(', ')}. ` +
                      'Call this tool again with one of them, or without the room parameter to cover the whole home.',
                  },
                ],
              };
            }
          }
        }

        const requestedDeviceTypes = (Array.isArray(deviceType) ? deviceType : [deviceType]).filter(Boolean);
        const deviceTypes = [
          ...new Set(
            requestedDeviceTypes.flatMap((requestedType) => resolveDeviceTypes(requestedType, availableDeviceTypes)),
          ),
        ];

        if (deviceTypes.length > 0) {
          selectedDevices = selectedDevices.filter((device) => {
            return device.features.some((feature) => deviceTypes.includes(feature.category));
          });
        }

        await Promise.all(
          selectedDevices.map(async (device) => {
            const deviceLastState = await this.gladys.device.getBySelector(device.selector);
            return device.features.map((feature) => {
              if (deviceTypes.length === 0 || deviceTypes.includes(feature.category)) {
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

        // An empty list is an ambiguous signal for the model, which tends to fill the
        // gap with a plausible value. Say explicitly that nothing is configured.
        if (states.length === 0) {
          const typeLabel = deviceTypes.length > 0 ? ` of type "${deviceTypes.join('", "')}"` : '';

          return {
            content: [
              {
                type: 'text',
                text:
                  `device.get-state: no device${typeLabel} is configured${scopeLabel}. ` +
                  'No measurement exists for this query, do not report any value.',
              },
            ],
          };
        }

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
          'Turn a device on or off. Requires either `device` (exact device name from the enum), or both `room` and `device_category` together. Never call with only `action`. For requests covering multiple rooms (for example "all lights"), call once per room with room and device_category, or use device_get_state with device_type light then turn off each device by name.',
        requireDeviceTargeting: true,
        categories: [AI_CHAT_TOOL_CATEGORIES.DEVICE_CONTROL, AI_CHAT_TOOL_CATEGORIES.OTHER],
        inputSchema: {
          action: z.enum(['on', 'off']).describe('Action to perform on the device.'),
          device: z
            .enum([...new Set(switchableDevices.map(({ name }) => name))])
            .describe('Exact device name. Required unless both room and device_category are provided.')
            .optional(),
          room: z
            .enum(rooms.map(({ name }) => name))
            .describe('Room name. Required together with device_category when device is not specified.')
            .optional(),
          device_category: z
            .enum(availableSwitchableFeatureCategories)
            .describe('Device type (light or switch). Required together with room when device is not specified.')
            .optional(),
        },
      },
      cb: async ({ action, device, room, device_category: deviceCategory }) => {
        const actionValue = action;

        if (!device && !(room && deviceCategory)) {
          return {
            content: [
              {
                type: 'text',
                text: `device.turn-${actionValue}: missing target. Provide device name, or both room and device_category. Never call with only action.`,
              },
            ],
          };
        }

        if (device && (room || deviceCategory)) {
          return {
            content: [
              {
                type: 'text',
                text: `device.turn-${actionValue}: mixed targeting. Provide device name only, or both room and device_category without device.`,
              },
            ],
          };
        }

        if (device) {
          const selectedDevice = this.findBySimilarity(switchableDevices, device);
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

          return {
            content: [
              {
                type: 'text',
                text: `device.turn-${actionValue} command not sent, no device found matching "${device}"`,
              },
            ],
          };
        }

        let selectedDevices = switchableDevices;
        const { selector } = this.findBySimilarity(rooms, room);
        selectedDevices = selectedDevices.filter((d) => (d.room?.selector || noRoom.selector) === selector);
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
        categories: [AI_CHAT_TOOL_CATEGORIES.DEVICE_QUERY, AI_CHAT_TOOL_CATEGORIES.OTHER],
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

  if (shutterDevices.length > 0) {
    tools.push({
      intent: 'device.set-shutter',
      config: {
        title: 'Control shutters and curtains',
        description:
          'Open, close, stop or set the position of shutters and curtains. Use action for open/close/stop commands, or position (0-100) to set a percentage. Select the device by name, or by room and device category.',
        categories: [AI_CHAT_TOOL_CATEGORIES.DEVICE_CONTROL, AI_CHAT_TOOL_CATEGORIES.OTHER],
        inputSchema: {
          action: z
            .enum(['open', 'close', 'stop'])
            .optional()
            .describe('Action to perform on the shutter or curtain.'),
          position: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe('Target position as a percentage from 0 (fully closed) to 100 (fully open).'),
          device: z
            .enum([...new Set(shutterDevices.map(({ name }) => name))])
            .describe('Device name to control.')
            .optional(),
          room: z
            .enum(rooms.map(({ name }) => name))
            .describe("Device's room if specified, required if device_category is specified.")
            .optional(),
          device_category: z
            .enum(availableShutterFeatureCategories)
            .describe('Type of device to control only if user has not specified device name.')
            .optional(),
        },
      },
      cb: async ({ action, position, device, room, device_category: deviceCategory }) => {
        if (!action && position === undefined) {
          return {
            content: [{ type: 'text', text: 'device.set-shutter: action or position is required' }],
          };
        }

        const actionToState = {
          open: COVER_STATE.OPEN,
          close: COVER_STATE.CLOSE,
          stop: COVER_STATE.STOP,
        };

        let selectedDevices = shutterDevices;

        if (room && room !== '') {
          const { selector } = this.findBySimilarity(rooms, room);
          selectedDevices = selectedDevices.filter((d) => (d.room?.selector || noRoom.selector) === selector);
        }

        if (device) {
          const selectedDevice = this.findBySimilarity(selectedDevices, device);
          if (selectedDevice?.name) {
            selectedDevices = [selectedDevice];
          } else {
            return {
              content: [{ type: 'text', text: 'device.set-shutter: no device found' }],
            };
          }
        } else if (room && deviceCategory) {
          selectedDevices = selectedDevices.filter((d) => d.features.some((f) => f.category === deviceCategory));
        }

        if (selectedDevices.length === 0) {
          return {
            content: [{ type: 'text', text: 'device.set-shutter: no device found' }],
          };
        }

        const requestedPosition = position !== undefined;
        const requestedAction = Boolean(action);
        const dispatchResults = [];

        await Promise.all(
          selectedDevices.map(async (d) => {
            const sent = [];
            const missing = [];

            if (requestedPosition) {
              const positionFeature = d.features.find((f) => f.type === 'position');
              if (positionFeature) {
                await this.gladys.device.setValue(d, positionFeature, position);
                sent.push(`position ${position}%`);
              } else {
                missing.push('position');
              }
            }

            if (requestedAction) {
              const stateFeature = d.features.find((f) => f.type === 'state');
              if (stateFeature) {
                await this.gladys.device.setValue(d, stateFeature, actionToState[action]);
                sent.push(action);
              } else {
                missing.push('state');
              }
            }

            dispatchResults.push({ device: d.name, sent, missing });
          }),
        );

        const successfulDevices = dispatchResults.filter((result) => result.sent.length > 0);
        const devicesWithMissingFeatures = dispatchResults.filter((result) => result.missing.length > 0);

        if (successfulDevices.length === 0) {
          const missingByDevice = devicesWithMissingFeatures
            .map((result) => `${result.device} (missing ${result.missing.join(' and ')} feature)`)
            .join('; ');

          return {
            content: [
              {
                type: 'text',
                text: `device.set-shutter: no command sent, no matching feature on ${missingByDevice}`,
              },
            ],
          };
        }

        const successMessage = successfulDevices
          .map((result) => `${result.sent.join(' and ')} command sent for ${result.device}`)
          .join('; ');

        if (devicesWithMissingFeatures.length > 0) {
          const partialFailures = devicesWithMissingFeatures
            .map((result) => `${result.device} (missing ${result.missing.join(' and ')} feature)`)
            .join('; ');

          return {
            content: [
              {
                type: 'text',
                text: `device.set-shutter: ${successMessage}; could not dispatch for ${partialFailures}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `device.set-shutter: ${successMessage}`,
            },
          ],
        };
      },
    });
  }

  if (lightControlDevices.length > 0) {
    tools.push({
      intent: 'device.set-light',
      config: {
        title: 'Set light brightness, color and color temperature',
        description:
          'Set the brightness, the color and/or the white color temperature of lights. ' +
          'Provide at least one of brightness (percent 0-100), color (hex RGB, for example #0000FF for blue) ' +
          'or temperature (Kelvin, for example 2700 for warm white, 4000 for neutral white, 6500 for cool white). ' +
          'Select the light by device name, or by room to target every light of the room. ' +
          'This tool does not turn lights on or off, use device_turn_on_off for that.',
        categories: [AI_CHAT_TOOL_CATEGORIES.DEVICE_CONTROL, AI_CHAT_TOOL_CATEGORIES.OTHER],
        inputSchema: {
          brightness: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe('Brightness as a percentage, from 0 to 100.'),
          color: z
            .string()
            .regex(/^#?[0-9a-fA-F]{6}$/)
            .optional()
            .describe("Color as a 6 digit hexadecimal RGB value, for example '#FF0000' for red."),
          temperature: z
            .number()
            .min(1000)
            .max(10000)
            .optional()
            .describe(
              'White color temperature in Kelvin, for example 2700 for warm white, 4000 for neutral white, 6500 for cool white.',
            ),
          device: z
            .enum([...new Set(lightControlDevices.map(({ name }) => name))])
            .describe('Light device name to control.')
            .optional(),
          room: z
            .enum(rooms.map(({ name }) => name))
            .describe('Room name, to control all lights of the room when device is not specified.')
            .optional(),
        },
      },
      cb: async ({ brightness, color, temperature, device, room }) => {
        if (brightness === undefined && color === undefined && temperature === undefined) {
          return {
            content: [{ type: 'text', text: 'device.set-light: brightness, color or temperature is required' }],
          };
        }

        if (!device && !room) {
          return {
            content: [{ type: 'text', text: 'device.set-light: device or room is required' }],
          };
        }

        let selectedDevices = lightControlDevices;

        if (room && room !== '') {
          const { selector } = this.findBySimilarity(rooms, room);
          selectedDevices = selectedDevices.filter((d) => (d.room?.selector || noRoom.selector) === selector);
        }

        if (device) {
          const selectedDevice = this.findBySimilarity(selectedDevices, device);
          if (selectedDevice?.name) {
            selectedDevices = [selectedDevice];
          } else {
            return {
              content: [{ type: 'text', text: 'device.set-light: no device found' }],
            };
          }
        }

        if (selectedDevices.length === 0) {
          return {
            content: [{ type: 'text', text: 'device.set-light: no device found' }],
          };
        }

        const dispatchResults = [];

        await Promise.all(
          selectedDevices.map(async (d) => {
            const sent = [];
            const missing = [];

            if (brightness !== undefined) {
              const brightnessFeature = d.features.find((f) => f.type === DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS);
              if (brightnessFeature) {
                const value = Math.round(normalize(brightness, 0, 100, brightnessFeature.min, brightnessFeature.max));
                await this.gladys.device.setValue(d, brightnessFeature, value);
                sent.push(`brightness ${brightness}%`);
              } else {
                missing.push('brightness');
              }
            }

            if (color !== undefined) {
              const colorFeature = d.features.find((f) => f.type === DEVICE_FEATURE_TYPES.LIGHT.COLOR);
              if (colorFeature) {
                await this.gladys.device.setValue(d, colorFeature, hexToInt(color));
                sent.push(`color ${color}`);
              } else {
                missing.push('color');
              }
            }

            if (temperature !== undefined) {
              const temperatureFeature = d.features.find((f) => f.type === DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE);
              if (temperatureFeature) {
                // Color temperature features are stored in mired (min = coolest, max = warmest).
                let value = Math.round(kelvinToMired(temperature));
                if (value > temperatureFeature.max) {
                  value = temperatureFeature.max;
                }
                if (value < temperatureFeature.min) {
                  value = temperatureFeature.min;
                }
                await this.gladys.device.setValue(d, temperatureFeature, value);
                sent.push(`temperature ${temperature}K`);
              } else {
                missing.push('temperature');
              }
            }

            dispatchResults.push({ device: d.name, sent, missing });
          }),
        );

        const successfulDevices = dispatchResults.filter((result) => result.sent.length > 0);
        const devicesWithMissingFeatures = dispatchResults.filter((result) => result.missing.length > 0);

        if (successfulDevices.length === 0) {
          const missingByDevice = devicesWithMissingFeatures
            .map((result) => `${result.device} (missing ${result.missing.join(' and ')} feature)`)
            .join('; ');

          return {
            content: [
              {
                type: 'text',
                text: `device.set-light: no command sent, no matching feature on ${missingByDevice}`,
              },
            ],
          };
        }

        const successMessage = successfulDevices
          .map((result) => `${result.sent.join(' and ')} command sent for ${result.device}`)
          .join('; ');

        if (devicesWithMissingFeatures.length > 0) {
          const partialFailures = devicesWithMissingFeatures
            .map((result) => `${result.device} (missing ${result.missing.join(' and ')} feature)`)
            .join('; ');

          return {
            content: [
              {
                type: 'text',
                text: `device.set-light: ${successMessage}; could not dispatch for ${partialFailures}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `device.set-light: ${successMessage}`,
            },
          ],
        };
      },
    });
  }

  if (writableSensorDevices.length > 0) {
    tools.push({
      intent: 'sensor.set-state',
      config: {
        title: 'Set sensor state',
        description:
          'Write a value to an MQTT virtual sensor (read-only sensor feature, for example after reading a value from a camera image). Use numeric values for numeric sensors and strings for text sensors such as license plates. Only MQTT virtual devices are supported.',
        categories: [
          AI_CHAT_TOOL_CATEGORIES.DEVICE_CONTROL,
          AI_CHAT_TOOL_CATEGORIES.DEVICE_QUERY,
          AI_CHAT_TOOL_CATEGORIES.OTHER,
        ],
        inputSchema: {
          device: z
            .enum([...new Set(writableSensorDevices.map(({ name }) => name))])
            .describe('MQTT virtual sensor device name (read-only sensor).'),
          feature: z
            .string()
            .optional()
            .describe(
              `Sensor feature name on the selected device. Required when the device has multiple features. Available: ${writableSensorDevices
                .map((d) => `${d.name}: [${d.features.map((f) => f.name).join(', ')}]`)
                .join('; ')}`,
            ),
          value: z
            .union([z.number(), z.string()])
            .describe('Value to write. Use a number for numeric sensors and a string for text sensors.'),
        },
      },
      cb: async ({ device, feature, value }) => {
        const selectedDevice = this.findBySimilarity(writableSensorDevices, device);
        const writableFeatures = selectedDevice.features;

        let selectedFeature;
        if (feature) {
          selectedFeature = this.findBySimilarity(writableFeatures, feature);
          if (!writableFeatures.some((writableFeature) => writableFeature.id === selectedFeature.id)) {
            throw new Error(
              `sensor.set-state validation failed (422): feature "${feature}" is not available on device ${selectedDevice.name}`,
            );
          }
        } else if (writableFeatures.length === 1) {
          [selectedFeature] = writableFeatures;
        } else {
          throw new Error(
            'sensor.set-state validation failed (422): feature is required when device has multiple writable sensor features',
          );
        }

        const isTextFeature = selectedFeature.category === DEVICE_FEATURE_CATEGORIES.TEXT;
        let parsedValue;
        let useStringValue;

        if (isTextFeature) {
          useStringValue = true;
          parsedValue = String(value);
        } else {
          if (typeof value === 'string' && Number.isNaN(Number(value))) {
            throw new Error('sensor.set-state validation failed (422): value must be a number for numeric sensors');
          }

          parsedValue = Number(value);
          useStringValue = false;

          if (Number.isNaN(parsedValue)) {
            throw new Error('sensor.set-state validation failed (422): value must be a number for numeric sensors');
          }
        }

        try {
          await this.gladys.device.setValue(selectedDevice, selectedFeature, parsedValue);
        } catch (e) {
          if (useStringValue) {
            await this.gladys.device.saveStringState(selectedDevice, selectedFeature, parsedValue);
          } else {
            await this.gladys.device.saveState(selectedFeature, parsedValue);
          }

          return {
            content: [
              {
                type: 'text',
                text: `sensor.set-state: set ${selectedDevice.name} / ${selectedFeature.name} to ${parsedValue}`,
              },
            ],
          };
        }

        // device.setValue persists string states of text features itself, nothing more to save

        return {
          content: [
            {
              type: 'text',
              text: `sensor.set-state: set ${selectedDevice.name} / ${selectedFeature.name} to ${parsedValue}`,
            },
          ],
        };
      },
    });
  }

  if (batteryDevices.length > 0) {
    tools.push({
      intent: 'device.get-battery-levels',
      config: {
        title: 'Get battery levels of devices',
        description:
          'Get the current battery level, in percent, of the battery powered devices of the home ' +
          '(sensors, remotes, door sensors and the like, the ones whose batteries are replaced or recharged). ' +
          'Use it for every question about their batteries: the level of one device, the levels of all of them, ' +
          'which batteries are low or have to be replaced. ' +
          'It does not cover the battery of an electric vehicle nor a home energy storage battery, ' +
          'which are separate device categories. ' +
          'Call it without any parameter to cover the whole home, or narrow it down with device or room. ' +
          'Results are sorted from the lowest level to the highest, so the batteries to replace come first. ' +
          'When warning_threshold is present, it is the battery warning threshold configured in this Gladys, ' +
          'in percent, and below_warning_threshold tells which levels are under it: use it as the meaning of ' +
          '"low" and of "to be replaced" instead of deciding yourself. ' +
          'An entry whose unit is not percent (a battery voltage) carries no below_warning_threshold, ' +
          'because the threshold is a percentage: report its value with its unit, do not call it low. ' +
          'Devices that do not report a battery level are never part of the result: they are either mains ' +
          'powered, or their integration only publishes a low battery alert instead of a level, ' +
          'so do not report a level for them.',
        categories: [AI_CHAT_TOOL_CATEGORIES.DEVICE_QUERY, AI_CHAT_TOOL_CATEGORIES.OTHER],
        inputSchema: {
          device: z
            .enum([...new Set(batteryDevices.map(({ name }) => name))])
            .describe('Battery powered device name, to get the battery level of this device only.')
            .optional(),
          room: z
            .enum(rooms.map(({ name }) => name))
            .describe('Room name, to get the battery levels of this room only. Leave empty to cover the whole home.')
            .optional(),
        },
      },
      cb: async ({ device, room }) => {
        let selectedDevices = batteryDevices;
        let scopeLabel = '';

        // Same reasoning as device.get-state: the chat gateway calls this callback with
        // the raw arguments of the model, which is not bound by the enums above. "État
        // des piles de la maison" makes it pass the house as a room, and the whole-home
        // question is precisely the primary one for this tool.
        if (room && room !== '') {
          const selectedRoom = this.findBySimilarity(rooms, room);

          if (selectedRoom?.selector) {
            selectedDevices = selectedDevices.filter(
              (d) => (d.room?.selector || noRoom.selector) === selectedRoom.selector,
            );
            scopeLabel = ` in room "${selectedRoom.name}"`;
          } else {
            const selectedHouse = this.findBySimilarity(houses, room);

            if (selectedHouse?.id) {
              // A house is the whole home, not a room: keep every battery device of its
              // rooms, plus the devices that are not assigned to a room.
              const houseRoomSelectors = rooms
                .filter((r) => r.house_id === selectedHouse.id)
                .map(({ selector }) => selector);
              selectedDevices = selectedDevices.filter(
                (d) => !d.room?.selector || houseRoomSelectors.includes(d.room.selector),
              );
              scopeLabel = ` in house "${selectedHouse.name}"`;
            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text:
                      `device.get-battery-levels: "${room}" is not a room of this home, no battery level was read. ` +
                      // "No room" is the sentinel holding the devices that were never assigned
                      // to a room, not a room the model should be invited to retry with.
                      `Available rooms: ${rooms
                        .filter(({ selector }) => selector !== noRoom.selector)
                        .map(({ name }) => name)
                        .join(', ')}. ` +
                      'Call this tool again with one of them, or without the room parameter to cover the whole home.',
                  },
                ],
              };
            }
          }
        }

        if (device && device !== '') {
          const selectedDevice = this.findBySimilarity(selectedDevices, device);

          // A device asked for by name and not found must not fall back to the whole
          // home: the model would then answer with the battery of another device.
          if (!selectedDevice?.name) {
            return {
              content: [
                {
                  type: 'text',
                  text:
                    `device.get-battery-levels: no device reporting a battery level matches "${device}"${scopeLabel}. ` +
                    `Devices reporting a battery level: ${[...new Set(batteryDevices.map(({ name }) => name))].join(
                      ', ',
                    )}. ` +
                    'Do not report a battery level for a device that is absent from this list.',
                },
              ],
            };
          }

          selectedDevices = [selectedDevice];
        }

        if (selectedDevices.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text:
                  `device.get-battery-levels: no device reporting a battery level is configured${scopeLabel}. ` +
                  'No battery level exists for this query, do not report any value.',
              },
            ],
          };
        }

        // "Which batteries are low" already has an answer in Gladys: the threshold of the
        // battery warning of this instance, used by device.checkBatteries and the weekly
        // digest. Surface it so the model does not invent its own meaning of "low".
        const configuredThreshold = await this.gladys.variable.getValue(
          SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD,
        );
        const warningThreshold = Number.parseFloat(configuredThreshold);
        const hasWarningThreshold = Number.isFinite(warningThreshold);

        const batteryLevels = [];

        await Promise.all(
          selectedDevices.map(async (d) => {
            const deviceLastState = await this.gladys.device.getBySelector(d.selector);

            d.features.forEach((feature) => {
              const featureLastState = deviceLastState.features.find((feat) => feat.id === feature.id);
              const formattedValue = this.formatValue(featureLastState);

              batteryLevels.push({
                room: d.room?.name || noRoom.name,
                device: d.name,
                feature: featureLastState.name,
                category: featureLastState.category,
                ...formattedValue,
                // Only a level that exists can be compared to the threshold: a device that
                // never reported one is neither below nor above it. The threshold is a
                // percentage, and the battery category accepts any unit at the model level:
                // a level published in volts, or without a unit, must not be compared to it.
                ...(hasWarningThreshold &&
                typeof formattedValue.value === 'number' &&
                featureLastState.unit === DEVICE_FEATURE_UNITS.PERCENT
                  ? { below_warning_threshold: formattedValue.value < warningThreshold }
                  : {}),
              });
            });
          }),
        );

        // Lowest battery first: what a user asking for the state of every battery of the
        // home wants is the ones to replace, and a long list is answered from its head.
        // A device that never reported a level cannot be compared, it goes last.
        batteryLevels.sort((a, b) => {
          if (typeof a.value !== 'number' && typeof b.value !== 'number') {
            return 0;
          }
          if (typeof a.value !== 'number') {
            return 1;
          }
          if (typeof b.value !== 'number') {
            return -1;
          }

          return a.value - b.value;
        });

        return {
          content: [
            {
              type: 'text',
              text: this.toon({
                ...(hasWarningThreshold ? { warning_threshold: warningThreshold } : {}),
                batteries: batteryLevels,
              }),
            },
          ],
        };
      },
    });
  }

  if (energyMonitoringDevices.length > 0) {
    tools.push({
      intent: 'device.get-energy-consumption',
      config: {
        title: 'Get energy consumption and cost over a period',
        description:
          'Get the electricity consumption (in kWh) or the consumption cost (in the home currency, for example euros) ' +
          'of an energy monitoring device over a date range. ' +
          'Dates are inclusive: for a single day use the same start_date and end_date, ' +
          'for a full month use the first and last day of the month. ' +
          'A day past the end of its month (for example 2026-02-30) is clamped to the last day of that month. ' +
          'To cover several months or a whole year, make a single call over the whole range with group_by month ' +
          'instead of one call per month. ' +
          'The result contains the total over the period and the detail per group_by period. ' +
          'In currency mode, a separate home_subscription entry may be present: it is the fixed subscription cost ' +
          'of the whole home electricity contract, and is not part of the device consumption cost.',
        categories: [AI_CHAT_TOOL_CATEGORIES.DEVICE_QUERY, AI_CHAT_TOOL_CATEGORIES.OTHER],
        inputSchema: {
          device: z
            .enum([...new Set(energyMonitoringDevices.map(({ name }) => name))])
            .describe('Energy monitoring device name.'),
          start_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .describe('Start date of the period in YYYY-MM-DD format, inclusive.'),
          end_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .describe('End date of the period in YYYY-MM-DD format, inclusive.'),
          unit: z
            .enum(['kwh', 'currency'])
            .describe('Use kwh to get the consumption in kWh, currency to get the cost in the home currency.'),
          group_by: z
            .enum(['hour', 'day', 'week', 'month', 'year'])
            .optional()
            .describe('Aggregation of the returned detail values. Defaults to day.'),
        },
      },
      cb: async ({ device, start_date: startDate, end_date: endDate, unit, group_by: groupBy }) => {
        const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

        const parseDateInput = (value) => {
          if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return null;
          }
          const [year, month, day] = value.split('-').map(Number);
          if (month < 1 || month > 12 || day < 1 || day > 31) {
            return null;
          }
          // "Last day of February" is a date a model has to compute, and it gets it
          // wrong on non-leap years (2026-02-29) or on 30-day months (2026-04-31).
          // That intent is unambiguous, so clamp to the end of the month instead of
          // failing: the Date constructor would silently roll over to the next month.
          const lastDayOfMonth = month === 2 && isLeapYear(year) ? 29 : DAYS_PER_MONTH[month - 1];
          return { year, month, day: Math.min(day, lastDayOfMonth) };
        };

        const formatDateInput = ({ year, month, day }) =>
          `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // new Date(year, ...) maps years 0 to 99 to 1900 to 1999, so a 4-digit year
        // below 0100 would query a period two millennia away from the one asked for.
        // Setting the year explicitly keeps it, and still rolls the day over the
        // month boundary as the exclusive end date needs.
        const createLocalDate = ({ year, month, day }) => {
          const date = new Date(2000, 0, 1);
          date.setFullYear(year, month - 1, day);
          return date;
        };

        const parsedStart = parseDateInput(startDate);
        const parsedEnd = parseDateInput(endDate);
        if (!parsedStart || !parsedEnd) {
          return {
            content: [
              {
                type: 'text',
                text:
                  'device.get-energy-consumption: start_date and end_date must be in YYYY-MM-DD format, ' +
                  'with a month between 01 and 12 and a day between 01 and 31',
              },
            ],
          };
        }

        const selectedDevice = this.findBySimilarity(energyMonitoringDevices, device);
        if (!selectedDevice?.name) {
          return {
            content: [
              {
                type: 'text',
                text: `device.get-energy-consumption: no energy monitoring device found matching "${device}"`,
              },
            ],
          };
        }

        const consumptionFeature = selectedDevice.features.find(
          (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
        );
        const costFeature = selectedDevice.features.find(
          (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
        );
        const displayMode = unit === 'currency' ? 'currency' : 'kwh';
        // In kwh mode a cost feature also works: getConsumptionByDates hot-swaps it
        // with its parent consumption feature through energy_parent_id.
        const selectedFeature = displayMode === 'currency' ? costFeature : consumptionFeature || costFeature;
        if (!selectedFeature) {
          return {
            content: [
              {
                type: 'text',
                text:
                  `device.get-energy-consumption: no consumption cost tracking configured on ${selectedDevice.name}. ` +
                  'An energy contract with prices must be configured in the energy monitoring settings.',
              },
            ],
          };
        }

        // Same date boundaries as the energy dashboard: local midnight, end exclusive.
        const from = createLocalDate(parsedStart);
        const to = createLocalDate({ ...parsedEnd, day: parsedEnd.day + 1 });
        if (!(from < to)) {
          return {
            content: [
              {
                type: 'text',
                text: 'device.get-energy-consumption: start_date must be before or equal to end_date',
              },
            ],
          };
        }

        const effectiveGroupBy = groupBy || 'day';
        const configuredTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
        const timezoneName = configuredTimezone || DEFAULT_TIMEZONE;

        const results = await this.gladys.device.energySensorManager.getConsumptionByDates([selectedFeature.selector], {
          from,
          to,
          group_by: effectiveGroupBy,
          display_mode: displayMode,
        });

        const deviceResult = results.find((result) => !result.deviceFeature?.is_subscription);
        const subscriptionResult = results.find((result) => result.deviceFeature?.is_subscription);

        const decimalPlaces = displayMode === 'currency' ? 2 : 3;
        const roundValue = (value) => Number(value.toFixed(decimalPlaces));
        const deviceValues = deviceResult?.values ?? [];

        // DuckDB truncates the TIMESTAMPTZ buckets in the timezone set on its
        // connection, which system.setDuckDbTimezone takes from the TIMEZONE variable.
        // A monthly bucket is therefore midnight on the 1st in the home timezone, and
        // serializing it as a UTC instant labels it one month early east of Greenwich:
        // 2026-01-01 in Paris reads back as 2025-12-31T23:00:00Z. Format in that same
        // timezone, at the granularity that was grouped by, so the label always matches
        // the bucket DuckDB built.
        // Intl rather than dayjs here: the dayjs timezone plugin resolves the offset of
        // an ambiguous local hour wrongly when the process runs in the target zone. It
        // reports +00:00 for the second 02:00 of a Paris fall-back night, which is the
        // one case the offset below exists to disambiguate.
        const bucketDateFormat = new Intl.DateTimeFormat('en-US', {
          timeZone: timezoneName,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        });

        // Distance between the local clock reading and the instant it stands for.
        // Computed from the formatted parts rather than read from a timeZoneName
        // part: that field is CLDR text, and a zero offset spells "GMT" on ICU 76
        // (Node 22.14) but "GMT+00:00" on ICU 78, both of which "node": "22.x"
        // accepts. Arithmetic is the same on every ICU, and gets the zones that sit
        // on a half or quarter hour right for free.
        const formatUtcOffset = (parts, bucketDate) => {
          const localAsUtc = new Date(0);
          localAsUtc.setUTCFullYear(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
          localAsUtc.setUTCHours(Number(parts.hour), Number(parts.minute), 0, 0);
          const offsetMinutes = Math.round((localAsUtc.getTime() - bucketDate.getTime()) / 60000);
          const sign = offsetMinutes < 0 ? '-' : '+';
          const absoluteMinutes = Math.abs(offsetMinutes);
          const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0');
          const minutes = String(absoluteMinutes % 60).padStart(2, '0');
          return `${sign}${hours}:${minutes}`;
        };

        const formatBucketDate = (bucketDate) => {
          const date = new Date(bucketDate);
          const parts = Object.fromEntries(
            bucketDateFormat.formatToParts(date).map(({ type, value }) => [type, value]),
          );
          switch (effectiveGroupBy) {
            case 'year':
              return parts.year;
            case 'month':
              return `${parts.year}-${parts.month}`;
            // The offset keeps hourly labels unique on the night a timezone falls
            // back: in Paris, 2025-10-26T00:00Z and 2025-10-26T01:00Z are two
            // different buckets that are both 02:00 on the local clock.
            case 'hour':
              return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:00${formatUtcOffset(parts, date)}`;
            // 'day' and 'week' are both a calendar day, the start of the bucket.
            default:
              return `${parts.year}-${parts.month}-${parts.day}`;
          }
        };

        const response = {
          device: selectedDevice.name,
          feature: selectedFeature.name,
          unit: displayMode === 'currency' ? deviceResult?.deviceFeature?.currency_unit || 'currency' : 'kWh',
          // Echo the effective period, not the raw input: a clamped date must not be
          // reported back as the day the caller asked for.
          start_date: formatDateInput(parsedStart),
          end_date: formatDateInput(parsedEnd),
          group_by: effectiveGroupBy,
          timezone: timezoneName,
          total: roundValue(deviceValues.reduce((acc, value) => acc + value.sum_value, 0)),
          values: deviceValues.map((value) => ({
            date: formatBucketDate(value.created_at),
            value: roundValue(value.sum_value),
          })),
        };

        if (subscriptionResult) {
          response.home_subscription = {
            name: subscriptionResult.deviceFeature.name,
            total: roundValue(subscriptionResult.values.reduce((acc, value) => acc + value.sum_value, 0)),
          };
        }

        if (deviceValues.length === 0) {
          response.note = 'No consumption data recorded for this device over this period.';
        }

        return {
          content: [
            {
              type: 'text',
              text: this.toon(response),
            },
          ],
        };
      },
    });
  }

  if (housesWithCoordinates.length > 0) {
    const defaultWeatherHouse = housesWithCoordinates[0];
    tools.push({
      intent: 'weather.get',
      config: {
        title: 'Get the weather at home',
        description:
          'Get the outside weather at the home location: the current conditions, the forecast for the coming hours ' +
          'and the daily forecast for the coming days, plus the weather alerts published for that location. ' +
          'Use it for every question about the weather, the outside temperature, rain, snow, wind, sun or ' +
          'weather alerts, whether it is about now, today, tomorrow or one of the next days. ' +
          'Never answer such a question from memory or from a previous answer: a forecast changes every hour. ' +
          'The condition of a moment is one of clear, cloud, drizzle, fog, rain, sleet, snow, thunderstorm, wind, ' +
          'night or unknown, and can be missing when the provider does not report it. ' +
          'Temperatures, wind speeds and precipitation are expressed in the units given by the result. ' +
          'The daily forecast is keyed by calendar date and does not necessarily start with today, ' +
          'so always pick the date the user asked about instead of the first entry.',
        categories: [AI_CHAT_TOOL_CATEGORIES.WEATHER, AI_CHAT_TOOL_CATEGORIES.OTHER],
        inputSchema: {
          house: z
            .enum([...new Set(housesWithCoordinates.map(({ name }) => name))])
            .describe(`Home to get the weather for. Defaults to ${defaultWeatherHouse.name}.`)
            .optional(),
        },
      },
      cb: async ({ house }) => {
        const houseFound = house ? this.findBySimilarity(housesWithCoordinates, house) : null;
        // A home asked for but not recognized must not be answered with another
        // home's forecast: on a multi-home install that is a wrong answer the
        // user cannot detect. With a single home there is nothing to
        // disambiguate, so the only known location answers.
        if (house && !houseFound?.selector && housesWithCoordinates.length > 1) {
          return {
            content: [
              {
                type: 'text',
                text:
                  `weather.get: no home found matching "${house}". ` +
                  `Available homes: ${housesWithCoordinates.map(({ name }) => name).join(', ')}. ` +
                  'Ask the user which one instead of reporting the weather of another home.',
              },
            ],
          };
        }
        const selectedHouse = houseFound?.selector ? houseFound : defaultWeatherHouse;

        // The unit system and the language are the ones of the user talking to
        // Gladys, like the weather routes: the provider answers in °C or °F
        // depending on that preference. An MCP client without a Gladys user
        // (Claude Desktop and friends) falls back to metric and English.
        let units = WEATHER_UNITS.METRIC;
        let language = 'en';
        if (userId) {
          try {
            const user = await this.gladys.user.getById(userId);
            units = user.distance_unit_preference || units;
            language = user.language || language;
          } catch (e) {
            // an unknown user is not a reason to refuse the weather
          }
        }

        let weather;
        try {
          weather = await this.gladys.weather.get({
            latitude: selectedHouse.latitude,
            longitude: selectedHouse.longitude,
            language,
            units,
          });
        } catch (e) {
          // The two cases the user can act on, and nothing else: a raw provider
          // message can carry transport internals (a request URL still holds
          // its API key) and it would travel to the model, then to the chat.
          const reason =
            e instanceof ServiceNotConfiguredError
              ? 'no weather integration is installed or configured in Gladys'
              : 'the weather provider could not be reached';
          return {
            content: [
              {
                type: 'text',
                text:
                  `weather.get: no weather available for ${selectedHouse.name}, ${reason}. ` +
                  'Tell the user, and do not give a forecast of your own.',
              },
            ],
          };
        }

        const configuredTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
        const timezoneName = configuredTimezone || DEFAULT_TIMEZONE;

        return {
          content: [
            {
              type: 'text',
              text: this.toon(formatWeather(weather, { house: selectedHouse.name, timezone: timezoneName, language })),
            },
          ],
        };
      },
    });
  }

  tools.push(
    {
      intent: 'web.fetch',
      config: {
        title: 'Fetch web page',
        description:
          'Fetch a public web page and return its readable text content. Use this to read information from websites such as opening hours, schedules, or public announcements. Only HTTP/HTTPS public URLs are allowed.',
        categories: [AI_CHAT_TOOL_CATEGORIES.WEB_AND_TIME, AI_CHAT_TOOL_CATEGORIES.OTHER],
        inputSchema: {
          url: z.url().describe('Full public URL of the page to fetch (http or https).'),
        },
      },
      cb: async ({ url }) => {
        const text = await fetchWebPage({ url });

        return {
          content: [
            {
              type: 'text',
              text,
            },
          ],
        };
      },
    },
    {
      intent: 'time.compare-times',
      config: {
        title: 'Compare times',
        description:
          'Compare times deterministically. Use operator in_ranges to check whether the current time (or reference_time) falls within one or more HH:mm ranges. Use before/after/same to compare two times. Prefer this tool over mental time reasoning for schedules and opening hours.',
        categories: [
          AI_CHAT_TOOL_CATEGORIES.WEB_AND_TIME,
          AI_CHAT_TOOL_CATEGORIES.SCENES,
          AI_CHAT_TOOL_CATEGORIES.OTHER,
        ],
        inputSchema: {
          operator: z
            .enum(['in_ranges', 'before', 'after', 'same'])
            .describe('Comparison to perform. Use in_ranges for opening hours.'),
          ranges: z
            .array(
              z.object({
                start: z.string().describe('Range start time in HH:mm or HHhmm.'),
                end: z.string().describe('Range end time in HH:mm or HHhmm.'),
              }),
            )
            .optional()
            .describe('Time ranges to test with in_ranges.'),
          reference_time: z
            .string()
            .optional()
            .describe('Reference time in HH:mm or HHhmm. Defaults to current home time.'),
          compare_to: z
            .string()
            .optional()
            .describe('Second time in HH:mm or HHhmm for before/after/same operators.'),
        },
      },
      cb: async ({ operator, ranges, reference_time: referenceTime, compare_to: compareTo }) => {
        const configuredTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
        const timezoneName = configuredTimezone || 'Europe/Paris';
        const result = compareTimes({
          timezone: timezoneName,
          operator,
          ranges,
          reference_time: referenceTime,
          compare_to: compareTo,
        });

        return {
          content: [
            {
              type: 'text',
              text: this.toon(result),
            },
          ],
        };
      },
    },
  );

  return tools;
}

module.exports = {
  getAllResources,
  getAllTools,
  extractProvidedActionTypes,
  flattenUnionIssues,
};
