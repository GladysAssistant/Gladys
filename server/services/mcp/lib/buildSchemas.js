const { z } = require('zod');

/**
 * @description Get all resources (room and devices) available for the MCP service.
 * @returns {Promise<Array>} Array of resources with home schema configuration.
 * @example
 * getAllResources()
 */
async function getAllResources() {
  const homeSchema = {};

  const rooms = (await this.gladys.room.getAll()).map(({ selector }) => selector);
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

    homeSchema[device.room.selector].devices[device.selector] = d;
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

    if (homeSchema[device.room.selector].devices[device.selector]?.name) {
      homeSchema[device.room.selector].devices[device.selector].features.push(...d.features);

      return;
    }

    homeSchema[device.room.selector].devices[device.selector] = d;
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
            .enum([...availableSensorFeatureCategories, ...availableSwitchableFeatureCategories])
            .optional()
            .describe('Type of device to query, leave empty to retrieve all devices.'),
        },
      },
      cb: async ({ room, device_type: deviceType }) => {
        const states = [];

        let selectedDevices = [...sensorDevices, ...switchableDevices];

        if (room && room !== '') {
          const { selector } = this.findBySimilarity(rooms, room);
          selectedDevices = selectedDevices.filter((device) => device.room.selector === selector);
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
                  room: device.room.name,
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
          content: states.map((state) => ({
            type: 'text',
            text: JSON.stringify(state),
          })),
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
            .enum(switchableDevices.map(({ name }) => name))
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
          selectedDevices = selectedDevices.filter((d) => d.room.selector === selector);
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
          content: [{ type: 'text', text: `device.turn-${actionValue} command not sent, no device found.` }],
        };
      },
    },
  ];
}

module.exports = {
  getAllResources,
  getAllTools,
};
