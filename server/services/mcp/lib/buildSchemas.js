const z = require('zod/v4');
const { SYSTEM_VARIABLE_NAMES, DEVICE_FEATURE_CATEGORIES, COVER_STATE } = require('../../../utils/constants');
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
  const rooms = (await this.gladys.room.getAll()).map(({ id, name, selector }) => ({ id, name, selector }));
  rooms.push(noRoom);
  const scenes = (await this.gladys.scene.get()).map(({ id, name, selector }) => ({ id, name, selector }));
  const users = (await this.gladys.user.get()).map(({ id, name, selector }) => ({ id, name, selector }));
  const houses = (await this.gladys.house.get()).map(({ id, name, selector }) => ({ id, name, selector }));
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

  const tools = [
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
        description: SCENE_CREATE_TOOL_DESCRIPTION,
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
            .enum([
              ...new Set([
                ...availableSensorFeatureCategories,
                ...availableSwitchableFeatureCategories,
                ...availableShutterFeatureCategories,
              ]),
            ])
            .optional()
            .describe('Type of device to query, leave empty to retrieve all devices.'),
        },
      },
      cb: async ({ room, device_type: deviceType }) => {
        const states = [];

        let selectedDevices = [...sensorDevices, ...switchableDevices, ...shutterDevices];

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
          'Turn a device on or off. Requires either `device` (exact device name from the enum), or both `room` and `device_category` together. Never call with only `action`. For requests covering multiple rooms (for example "all lights"), call once per room with room and device_category, or use device_get_state with device_type light then turn off each device by name.',
        requireDeviceTargeting: true,
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

  if (writableSensorDevices.length > 0) {
    tools.push({
      intent: 'sensor.set-state',
      config: {
        title: 'Set sensor state',
        description:
          'Write a value to an MQTT virtual sensor (read-only sensor feature, for example after reading a value from a camera image). Use numeric values for numeric sensors and strings for text sensors such as license plates. Only MQTT virtual devices are supported.',
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

        if (useStringValue) {
          await this.gladys.device.saveStringState(selectedDevice, selectedFeature, parsedValue);
        }

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

  tools.push(
    {
      intent: 'web.fetch',
      config: {
        title: 'Fetch web page',
        description:
          'Fetch a public web page and return its readable text content. Use this to read information from websites such as opening hours, schedules, or public announcements. Only HTTP/HTTPS public URLs are allowed.',
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
