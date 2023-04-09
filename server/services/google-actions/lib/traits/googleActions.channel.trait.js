const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { getDeviceFeature } = require('../../../../utils/device');

/**
 * @see https://developers.google.com/assistant/smarthome/traits/channel
 */
const channelTrait = {
  key: 'action.devices.traits.Channel',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_UP,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_DOWN,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_PREVIOUS,
    },
  ],
  generateAttributes: (device) => {
    const channelFeature = getDeviceFeature(
      device,
      DEVICE_FEATURE_CATEGORIES.TELEVISION,
      DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL,
    );
    const { has_feedback: hasFeedback = false } = channelFeature || {};

    return {
      commandOnlyChannels: !hasFeedback,
    };
  },
  states: [],
  commands: {
    'action.devices.commands.selectChannel': (device, params) => {
      const events = [];

      const channelFeature = getDeviceFeature(
        device,
        DEVICE_FEATURE_CATEGORIES.TELEVISION,
        DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL,
      );
      if (channelFeature) {
        events.push({
          device_feature: channelFeature.selector,
          value: params.channelNumber,
        });
      }

      return { events };
    },
    'action.devices.commands.relativeChannel': (device, params) => {
      const events = [];

      const { relativeChannelChange } = params;

      // Looks for relative channel feature
      const relativeChannelFeature = getDeviceFeature(
        device,
        DEVICE_FEATURE_CATEGORIES.TELEVISION,
        relativeChannelChange < 0
          ? DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_DOWN
          : DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_UP,
      );
      if (relativeChannelFeature) {
        for (let i = 0; i < Math.abs(relativeChannelChange); i += 1) {
          events.push({
            device_feature: relativeChannelFeature.selector,
            value: 1,
          });
        }
      } else {
        // Set volume
        const channelFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.TELEVISION,
          DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL,
        );

        if (channelFeature) {
          events.push({
            device_feature: channelFeature.selector,
            value: channelFeature.last_value + relativeChannelChange,
          });
        }
      }

      return { events };
    },
    'action.devices.commands.returnChannel': (device) => {
      const events = [];

      const previousChannelFeature = getDeviceFeature(
        device,
        DEVICE_FEATURE_CATEGORIES.TELEVISION,
        DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_PREVIOUS,
      );
      if (previousChannelFeature) {
        events.push({
          device_feature: previousChannelFeature.selector,
          value: 1,
        });
      }

      return { events };
    },
  },
};

module.exports = {
  channelTrait,
};
