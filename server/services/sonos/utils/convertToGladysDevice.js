const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const convertToGladysDevice = (serviceId, device) => {
  return {
    name: device.name,
    external_id: `sonos:${device.uuid}`,
    service_id: serviceId,
    should_poll: false,
    features: [
      {
        name: `${device.name} - Play`,
        external_id: `sonos:${device.uuid}:play`,
        category: DEVICE_FEATURE_CATEGORIES.MUSIC,
        type: DEVICE_FEATURE_TYPES.MUSIC.PLAY,
        min: 1,
        max: 1,
        keep_history: false,
        read_only: false,
        has_feedback: false,
      },
      {
        name: `${device.name} - Pause`,
        external_id: `sonos:${device.uuid}:pause`,
        category: DEVICE_FEATURE_CATEGORIES.MUSIC,
        type: DEVICE_FEATURE_TYPES.MUSIC.PAUSE,
        min: 1,
        max: 1,
        keep_history: false,
        read_only: false,
        has_feedback: false,
      },
      {
        name: `${device.name} - Previous`,
        external_id: `sonos:${device.uuid}:previous`,
        category: DEVICE_FEATURE_CATEGORIES.MUSIC,
        type: DEVICE_FEATURE_TYPES.MUSIC.PREVIOUS,
        min: 1,
        max: 1,
        keep_history: false,
        read_only: false,
        has_feedback: false,
      },
      {
        name: `${device.name} - Next`,
        external_id: `sonos:${device.uuid}:next`,
        category: DEVICE_FEATURE_CATEGORIES.MUSIC,
        type: DEVICE_FEATURE_TYPES.MUSIC.NEXT,
        min: 1,
        max: 1,
        keep_history: false,
        read_only: false,
        has_feedback: false,
      },
      {
        name: `${device.name} - Volume`,
        external_id: `sonos:${device.uuid}:volume`,
        category: DEVICE_FEATURE_CATEGORIES.MUSIC,
        type: DEVICE_FEATURE_TYPES.MUSIC.VOLUME,
        min: 0,
        max: 100,
        keep_history: false,
        read_only: false,
        has_feedback: false,
      },
      {
        name: `${device.name} - PlayBack State`,
        external_id: `sonos:${device.uuid}:playback-state`,
        category: DEVICE_FEATURE_CATEGORIES.MUSIC,
        type: DEVICE_FEATURE_TYPES.MUSIC.PLAYBACK_STATE,
        min: 0,
        max: 1,
        keep_history: false,
        read_only: true,
        has_feedback: false,
      },
    ],
  };
};

module.exports = {
  convertToGladysDevice,
};
