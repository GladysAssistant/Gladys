const { z } = require('zod');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

const sensorFeatureCategories = [
  DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR,
  DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
  DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
  DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
  DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
  DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
  DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
  DEVICE_FEATURE_CATEGORIES.PM25_SENSOR,
  DEVICE_FEATURE_CATEGORIES.FORMALDEHYD_SENSOR,
  DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR,
  DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.VOC_SENSOR,
];

const switchableFeatureCategories = [
  DEVICE_FEATURE_CATEGORIES.LIGHT,
  DEVICE_FEATURE_CATEGORIES.SWITCH,
  DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
];

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
      devices: {}
    };
  });

  let sensorDevices = (await this.gladys.device.get()).filter(device => {
    return device.features.some(feature => sensorFeatureCategories.includes(feature.category));
  });
  sensorDevices = sensorDevices.map(device => {
    device.features = device.features.filter(feature => sensorFeatureCategories.includes(feature.category));
    return device;
  });

  sensorDevices.forEach((device) => {
    const d = {
      name: device.name,
      selector: device.selector,
      features: device.features.map((feature) => ({
        name: feature.name,
        selector: feature.selector,
        category: feature.category,
        type: feature.type,
        access: 'read',
      })),
    };

    homeSchema[device.room.selector].devices[device.selector] = d;
  });

  let switchableDevices = (await this.gladys.device.get()).filter(device => {
    return device.features.some(feature => switchableFeatureCategories.includes(feature.category) && feature.type === 'binary');
  });
  switchableDevices = switchableDevices.map(device => {
    device.features = device.features.filter(feature => switchableFeatureCategories.includes(feature.category) && feature.type === 'binary');
    return device;
  });

  switchableDevices.forEach((device) => {
    const d = {
      name: device.name,
      selector: device.selector,
      features: device.features.map((feature) => ({
        name: feature.name,
        selector: feature.selector,
        category: feature.category,
        type: feature.type,
        access: 'write',
      })),
    };

    if (homeSchema[device.room.selector].devices[device.selector]?.name) {
      homeSchema[device.room.selector].devices[device.selector].features.push(...d.features);

      return;
    }

    homeSchema[device.room.selector].devices[device.selector] = d;
  });

  return [{
    name: 'home',
    uri: 'schema://home',
    config: {
      title: 'Home devices and rooms structure',
      description: 'Structure of home by room with all their devices and associated features.',
      mimeType: 'application/json',
    },
    cb: async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify(homeSchema)
      }]
    })
  }];
}

/**
 * @description Get all tools available in the MCP service.
 * @returns {Promise<Array>} Array of tools with their intent and configuration.
 * @example
 * getAllTools()
 */
async function getAllTools() {
  const rooms = (await this.gladys.room.getAll()).map(({ selector }) => selector);
  const scenes = (await this.gladys.scene.get()).map(({ selector }) => selector);
  let sensorDevices = (await this.gladys.device.get()).filter(device => {
    return device.features.some(feature => sensorFeatureCategories.includes(feature.category));
  });
  sensorDevices = sensorDevices.map(device => {
    device.features = device.features.filter(feature => sensorFeatureCategories.includes(feature.category));
    return device;
  });
  const availableSensorFeatureCategories = [...new Set(sensorDevices.map(device => {
    return device.features.map(feature => feature.category);
  }).flat())];

  let switchableDevices = (await this.gladys.device.get()).filter(device => {
    return device.features.some(feature => switchableFeatureCategories.includes(feature.category) && feature.type === 'binary');
  });
  switchableDevices = switchableDevices.map(device => {
    device.features = device.features.filter(feature => switchableFeatureCategories.includes(feature.category) && feature.type === 'binary');
    return device;
  });
  const availableSwitchableFeatureCategories = [...new Set(switchableDevices.map(device => {
    return device.features.map(feature => feature.category);
  }).flat())];

  return [
    {
      intent: 'camera.get-image',
      config: {
        title: 'Get image from camera',
        description: 'Get image from camera in specific room.',
        inputSchema: {
          room: z.enum(rooms).describe('Room to get image from.'),
        },
      },
      cb: async ({ room }) => {
        const { id } = await this.gladys.room.getBySelector(room);

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
          scene: z.enum(scenes).describe('Scene name to start.'),
        },
      },
      cb: async ({ scene }) => {
        const classification = {
          intent: 'scene.start',
        };

        if (scene) {
          const sceneId = this.gladys.scene.brain.getEntityIdByName('scene', scene);
          classification.entities = [{ entity: 'scene', option: sceneId, sourceText: scene }];
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
          room: z.enum(rooms).optional().describe('Room to get information from, leave empty to select multiple rooms.'),
          sensor_type: z.enum(availableSensorFeatureCategories).optional().describe('Type of sensor to query, leave empty to retrieve all devices.'),
        },
      },
      cb: async ({ room, sensor_type: sensorType }) => {
        const states = [];

        let selectedDevices = sensorDevices;

        if (room && room !== '') {
          selectedDevices = selectedDevices.filter(device => device.room.selector === room);
        }

        if (sensorType && sensorType.length > 0) {
          selectedDevices = selectedDevices.filter(device => {
            return device.features.some(feature => sensorType.includes(feature.category));
          });
        }

        await Promise.all(selectedDevices.map(async (device) => {
          const deviceLastState = await this.gladys.device.getBySelector(device.selector);
          return device.features.map(feature => {
            if (!sensorType || sensorType.length === 0 || sensorType.includes(feature.category)) {
              const featureLastState = deviceLastState.features.find(feat => feat.id === feature.id);

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
        }));

        return {
          content: states.map(state => ({
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
        description: 'Turn on/off specific device selected either by the name if we know it else by it room and it device type.',
        inputSchema: {
          action: z.enum(['on', 'off']).describe('Action to perform on the device.'),
          device: z.enum(switchableDevices.map(d => d.selector)).describe('Device name to turn on/off.').optional(),
          room: z.enum(rooms).describe("Device's room only if we don't know it name.").optional(),
          device_category: z.enum(availableSwitchableFeatureCategories).describe("Type of device to turn on/off only if we don't know it name.").optional(),
        }
      },
      cb: async ({ action, device, room, device_category: deviceCategory }) => {
        if (device) {
          const selectedDevice = switchableDevices.find(d => d.selector === device);
          if (selectedDevice) {
            await Promise.all(selectedDevice.features.map(f => {
              return this.gladys.device.setValue(selectedDevice, f, action === 'on' ? 1 : 0);
            }));

            return {
              content: [{ type: 'text', text: `device.turn-${action} command sent for ${device}` }],
            };
          }
        }

        if (room && deviceCategory) {
          const selectedDevices = switchableDevices.filter(d =>
            (d.room.selector === room && d.features.some(f => f.category === deviceCategory))
          );

          if (selectedDevices.length > 0) {
            await Promise.all(selectedDevices.map(d => {
              return Promise.all(d.features.map(f => {
                if (f.category === deviceCategory) {
                  return this.gladys.device.setValue(d, f, action === 'on' ? 1 : 0);
                }

                return null;
              }));
            }));

            return {
              content: [{ type: 'text', text: `device.turn-${action} command sent for devices in room ${room} with category ${deviceCategory}` }],
            };
          }
        }

        return {
          content: [{ type: 'text', text: `device.turn-${action} command not sent, no device found.` }],
        };
      },
    },
  ];
}

module.exports = {
  getAllResources,
  getAllTools,
};
