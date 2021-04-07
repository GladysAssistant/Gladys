const uuid = require('uuid');
const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

const create = async function create(lgDevice) {
  const service = await this.gladys.service.getByName('lgtv');

  const uniqueId = uuid.v4();
  const device = {
    id: uniqueId,
    name: lgDevice.modelName,
    model: lgDevice.modelName,
    service_id: service.id,
    external_id: lgDevice.deviceExternalID,
    features: [
      {
        name: DEVICE_FEATURE_TYPES.MEDIA_PLAYER.CHANNEL,
        category: DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER,
        type: DEVICE_FEATURE_TYPES.MEDIA_PLAYER.CHANNEL,
        read_only: false,
        keep_history: true,
        has_feedback: false,
        external_id: `${uniqueId}:${DEVICE_FEATURE_TYPES.MEDIA_PLAYER.CHANNEL}`,
        min: 0,
        max: 999,
      },
      {
        name: DEVICE_FEATURE_TYPES.MEDIA_PLAYER.POWER,
        category: DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER,
        type: DEVICE_FEATURE_TYPES.MEDIA_PLAYER.POWER,
        read_only: false,
        keep_history: true,
        has_feedback: false,
        external_id: `${uniqueId}:${DEVICE_FEATURE_TYPES.MEDIA_PLAYER.POWER}`,
        min: 0,
        max: 1,
      },
      {
        name: DEVICE_FEATURE_TYPES.MEDIA_PLAYER.VOLUME,
        category: DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER,
        type: DEVICE_FEATURE_TYPES.MEDIA_PLAYER.VOLUME,
        read_only: false,
        keep_history: false,
        has_feedback: false,
        external_id: `${uniqueId}:${DEVICE_FEATURE_TYPES.MEDIA_PLAYER.VOLUME}`,
        min: 0,
        max: 100,
      },
      {
        name: DEVICE_FEATURE_TYPES.MEDIA_PLAYER.MUTED,
        category: DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER,
        type: DEVICE_FEATURE_TYPES.MEDIA_PLAYER.MUTED,
        read_only: false,
        keep_history: false,
        has_feedback: false,
        external_id: `${uniqueId}:${DEVICE_FEATURE_TYPES.MEDIA_PLAYER.MUTED}`,
        min: 0,
        max: 1,
      },
      {
        name: DEVICE_FEATURE_TYPES.MEDIA_PLAYER.SOURCE,
        category: DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER,
        type: DEVICE_FEATURE_TYPES.MEDIA_PLAYER.SOURCE,
        read_only: false,
        keep_history: false,
        has_feedback: false,
        external_id: `${uniqueId}:${DEVICE_FEATURE_TYPES.MEDIA_PLAYER.SOURCE}`,
        min: 0,
        max: 1,
      },
    ],
    params: [
      {
        name: 'address',
        value: lgDevice.address,
      },
      {
        name: 'source_list',
        value: JSON.stringify([]),
      },
    ],
  };

  return this.gladys.device.create(device);
};

module.exports = create;
