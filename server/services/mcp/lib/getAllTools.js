const { z } = require('zod');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

const featureCategories = [
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

/**
 * @description Get all tools available in the MCP service.
 * @returns {Promise<Array>} Array of tools with their intent and configuration.
 * @example
 * getAllTools()
 */
async function getAllTools() {
  const rooms = (await this.gladys.room.getAll()).map(({ selector }) => selector);
  const scenes = (await this.gladys.scene.get()).map(({ selector }) => selector);
  let devices = (await this.gladys.device.get()).filter(device => {
    return device.features.some(feature => featureCategories.includes(feature.category));
  });
  devices = devices.map(device => {
    device.features = device.features.filter(feature => featureCategories.includes(feature.category));
    return device;
  });
  const availableFeatureCategories = [...new Set(devices.map(device => {
    return device.features.map(feature => feature.category);
  }).flat())];

  return [
    {
      intent: 'camera.get-image',
      config: {
        title: 'Get image from camera',
        description: 'Get image from specific camera or specific room.',
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
      intent: 'light.turn-on',
      config: {
        title: 'Turn on light',
        description: 'Turn on a light in a specific room.',
        inputSchema: {
          room: z.string().describe('Room to turn on the light in.'),
        },
      },
      cb: async ({ room }) => {
        const classification = {
          intent: 'light.turn-on',
        };

        if (room) {
          const roomId = this.gladys.room.brain.getEntityIdByName('room', room);
          classification.entities = [{ entity: 'room', option: roomId, sourceText: room }];
        }

        this.gladys.event.emit(`intent.light.turn-on`, undefined, classification, {});

        return {
          content: [{ type: 'text', text: 'light.turn-on command sent' }],
        };
      },
    },
    {
      intent: 'light.turn-off',
      config: {
        title: 'Turn off light',
        description: 'Turn off a light in a specific room.',
        inputSchema: {
          room: z.string().describe('Room to turn off the light in.'),
        },
      },
      cb: async ({ room }) => {
        const classification = {
          intent: 'light.turn-off',
        };

        if (room) {
          const roomId = this.gladys.room.brain.getEntityIdByName('room', room);
          classification.entities = [{ entity: 'room', option: roomId, sourceText: room }];
        }

        this.gladys.event.emit(`intent.light.turn-off`, undefined, classification, {});

        return {
          content: [{ type: 'text', text: 'light.turn-off command sent' }],
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
          room: z.enum(rooms).describe('Room to get information from.').optional(),
          sensor_type: z.array(z.enum(availableFeatureCategories)).describe('Type of sensor to query, empty array to retrieve all sensors.').optional(),
        },
      },
      cb: async ({ room, feature_categories: featCategories }) => {
        const states = [];

        let selectedDevices = devices;

        if (room && room !== '') {
          selectedDevices = selectedDevices.filter(device => device.room.selector === room);
        }

        if (featCategories && featCategories.length > 0) {
          selectedDevices = selectedDevices.filter(device => {
            return device.features.some(feature => featCategories.includes(feature.category));
          });
        }

        await Promise.all(selectedDevices.map(async (device) => {
          const deviceLastState = await this.gladys.device.getBySelector(device.selector);
          return device.features.map(feature => {
            if (!featCategories || featCategories.length === 0 || featCategories.includes(feature.category)) {
              const featureLastState = deviceLastState.features.find(feat => feat.id === feature.id);

              states.push({
                room: device.room.name,
                device: device.name,
                feature: featureLastState.name,
                category: featureLastState.category,
                value: featureLastState.last_value,
                unit: featureLastState.unit,
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
  ];
}

module.exports = {
  getAllTools,
};
