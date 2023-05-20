const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { getDeviceFeature } = require('../../../../utils/device');

const DEFAULT_MAX_LEVEL = 30;

/**
 * @see https://developers.google.com/assistant/smarthome/traits/volume
 */
const volumeTrait = {
  key: 'action.devices.traits.Volume',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_UP,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_DOWN,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_MUTE,
    },
  ],
  generateAttributes: (device) => {
    const volumeFeature = getDeviceFeature(
      device,
      DEVICE_FEATURE_CATEGORIES.TELEVISION,
      DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
    );
    const { has_feedback: hasFeedback = false, max = DEFAULT_MAX_LEVEL } = volumeFeature || {};

    const muteFeature = getDeviceFeature(
      device,
      DEVICE_FEATURE_CATEGORIES.TELEVISION,
      DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_MUTE,
    );

    return {
      volumeMaxLevel: max,
      volumeCanMuteAndUnmute: !!muteFeature,
      commandOnlyVolume: !hasFeedback,
    };
  },
  states: [
    {
      key: 'currentVolume',
      readValue: (feature) => {
        return feature.last_value || DEFAULT_MAX_LEVEL / 2;
      },
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
        },
      ],
    },
    {
      key: 'isMuted',
      readValue: (feature) => {
        const { has_feedback: hasFeedback, last_value: value } = feature;
        const valueToMap = hasFeedback ? value : 0;
        return valueToMap === 1;
      },
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_MUTE,
        },
      ],
    },
  ],
  commands: {
    'action.devices.commands.mute': (device, params) => {
      const events = [];

      const muteFeature = getDeviceFeature(
        device,
        DEVICE_FEATURE_CATEGORIES.TELEVISION,
        DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_MUTE,
      );
      if (muteFeature) {
        events.push({
          device_feature: muteFeature.selector,
          value: params.mute ? 1 : 0,
        });
      }

      return { events };
    },
    'action.devices.commands.setVolume': (device, params) => {
      const events = [];

      const volumeFeature = getDeviceFeature(
        device,
        DEVICE_FEATURE_CATEGORIES.TELEVISION,
        DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
      );
      if (volumeFeature) {
        events.push({
          device_feature: volumeFeature.selector,
          value: params.volumeLevel,
        });
      }

      return { events };
    },
    'action.devices.commands.volumeRelative': (device, params) => {
      const events = [];
      const { relativeSteps } = params;

      // Looks for relative volume feature
      const relativeVolumeFeature = getDeviceFeature(
        device,
        DEVICE_FEATURE_CATEGORIES.TELEVISION,
        relativeSteps < 0 ? DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_DOWN : DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_UP,
      );
      if (relativeVolumeFeature) {
        for (let i = 0; i < Math.abs(relativeSteps); i += 1) {
          events.push({
            device_feature: relativeVolumeFeature.selector,
            value: 1,
          });
        }
      } else {
        // Set volume
        const volumeFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.TELEVISION,
          DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
        );

        if (volumeFeature) {
          events.push({
            device_feature: volumeFeature.selector,
            value: volumeFeature.last_value + relativeSteps,
          });
        }
      }

      return { events };
    },
  },
};

module.exports = {
  volumeTrait,
};
