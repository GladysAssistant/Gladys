const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { getDeviceFeature } = require('../../../../utils/device');

const COMMAND_BY_TYPE = {
  [DEVICE_FEATURE_TYPES.TELEVISION.PAUSE]: 'PAUSE',
  [DEVICE_FEATURE_TYPES.TELEVISION.PLAY]: 'RESUME',
  [DEVICE_FEATURE_TYPES.TELEVISION.STOP]: 'STOP',
  [DEVICE_FEATURE_TYPES.TELEVISION.NEXT]: 'NEXT',
  [DEVICE_FEATURE_TYPES.TELEVISION.PREVIOUS]: 'PREVIOUS',
};

const generateEvents = (device, featureType) => {
  const events = [];

  const nextFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.TELEVISION, featureType);
  if (nextFeature) {
    events.push({
      device_feature: nextFeature.selector,
      value: 1,
    });
  }

  return { events };
};

/**
 * @see https://developers.google.com/assistant/smarthome/traits/transportcontrol
 */
const transportControl = {
  key: 'action.devices.traits.TransportControl',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.PAUSE,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.PLAY,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.STOP,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.NEXT,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.PREVIOUS,
    },
  ],
  generateAttributes: (device) => {
    const transportControlSupportedCommands = new Set();
    device.features
      .filter((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.TELEVISION)
      .forEach((feature) => {
        const { type } = feature;
        const command = COMMAND_BY_TYPE[type];
        if (command) {
          transportControlSupportedCommands.add(command);
        }
      });

    return {
      transportControlSupportedCommands: Array.from(transportControlSupportedCommands),
    };
  },
  states: [],
  commands: {
    'action.devices.commands.mediaStop': (device) => generateEvents(device, DEVICE_FEATURE_TYPES.TELEVISION.STOP),
    'action.devices.commands.mediaPause': (device) => generateEvents(device, DEVICE_FEATURE_TYPES.TELEVISION.PAUSE),
    'action.devices.commands.mediaResume': (device) => generateEvents(device, DEVICE_FEATURE_TYPES.TELEVISION.PLAY),
    'action.devices.commands.mediaNext': (device) => generateEvents(device, DEVICE_FEATURE_TYPES.TELEVISION.NEXT),
    'action.devices.commands.mediaPrevious': (device) =>
      generateEvents(device, DEVICE_FEATURE_TYPES.TELEVISION.PREVIOUS),
  },
};

module.exports = {
  transportControl,
};
