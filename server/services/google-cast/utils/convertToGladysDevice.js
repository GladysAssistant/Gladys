const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const convertToGladysDevice = (serviceId, device) => {
  return {
    name: device.name,
    external_id: `google-cast:${device.name}`,
    service_id: serviceId,
    should_poll: false,
    features: [
      {
        name: `${device.name} - Play Notification`,
        external_id: `google-cast:${device.name}:play-notification`,
        category: DEVICE_FEATURE_CATEGORIES.MUSIC,
        type: DEVICE_FEATURE_TYPES.MUSIC.PLAY_NOTIFICATION,
        min: 1,
        max: 1,
        keep_history: false,
        read_only: false,
        has_feedback: false,
      },
    ],
  };
};

module.exports = {
  convertToGladysDevice,
};
