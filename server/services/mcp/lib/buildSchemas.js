const { z } = require('zod');

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

  const sensorDevices = (await this.gladys.device.get())
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

  const switchableDevices = (await this.gladys.device.get())
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
  const sensorDevices = (await this.gladys.device.get())
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

  const switchableDevices = (await this.gladys.device.get())
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

  const historyDevices = (await this.gladys.device.get())
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
};
