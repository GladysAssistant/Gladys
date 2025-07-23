const { z } = require('zod');

/**
 * @description Get all tools available in the MCP service.
 * @returns {Promise<Array>} Array of tools with their intent and configuration.
 * @example
 * getAllTools()
 */
async function getAllTools() {
  const rooms = (await this.gladys.room.getAll()).map(({ selector }) => selector);
  const scenes = (await this.gladys.scene.get()).map(({ selector }) => selector);

  return [
    {
      intent: 'temperature-sensor.get-in-room',
      config: {
        title: 'Get temperature in room',
        description: 'Get the temperature in a specific room.',
        inputSchema: {
          room: z.enum(rooms).describe('Room to get temperature from.'),
        },
      },
      cb: async ({ room }) => {
        const { id } = await this.gladys.room.getBySelector(room);

        const temperature = await this.gladys.device.temperatureSensorManager.getTemperatureInRoom(id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(temperature),
            },
          ],
        };
      },
    },
    {
      intent: 'humidity-sensor.get-in-room',
      config: {
        title: 'Get himidity in room',
        description: 'Get the himidity in a specific room.',
        inputSchema: {
          room: z.enum(rooms).describe('Room to get himidity from.'),
        },
      },
      cb: async ({ room }) => {
        const { id } = await this.gladys.room.getBySelector(room);

        const himidity = await this.gladys.device.humiditySensorManager.getHumidityInRoom(id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(himidity),
            },
          ],
        };
      },
    },
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
  ];
}

module.exports = {
  getAllTools,
};
