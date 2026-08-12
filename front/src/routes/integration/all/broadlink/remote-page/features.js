import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';

export const MANAGED_FEATURES = {
  [DEVICE_FEATURE_CATEGORIES.CURTAIN]: {
    [DEVICE_FEATURE_TYPES.CURTAIN.STATE]: {
      feature: {
        min: -1,
        max: 1
      },
      values: [-1, 0, 1]
    }
  },
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: {
      feature: {
        min: 0,
        max: 1
      },
      values: [0, 1]
    },
    [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: {
      feature: {
        min: 0,
        max: 2
      },
      values: [0, 2]
    },
    [DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]: {
      feature: {
        min: 0,
        max: 2
      },
      values: [0, 2]
    }
  },
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: {
      feature: {
        min: 0,
        max: 1
      },
      values: [0, 1]
    },
    [DEVICE_FEATURE_TYPES.SWITCH.DIMMER]: {
      feature: {
        min: 0,
        max: 1
      },
      values: [0, 1]
    }
  },
  [DEVICE_FEATURE_CATEGORIES.SIREN]: {
    [DEVICE_FEATURE_TYPES.SIREN.BINARY]: {
      feature: {
        min: 0,
        max: 1
      },
      values: [0, 1]
    }
  },
  [DEVICE_FEATURE_CATEGORIES.SHUTTER]: {
    [DEVICE_FEATURE_TYPES.SHUTTER.STATE]: {
      feature: {
        min: -1,
        max: 1
      },
      values: [-1, 0, 1]
    }
  },
  [DEVICE_FEATURE_CATEGORIES.TELEVISION]: {
    [DEVICE_FEATURE_TYPES.TELEVISION.BINARY]: {
      feature: {
        min: 0,
        max: 1
      },
      values: [0, 1]
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.SOURCE]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL]: {
      values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_DOWN]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_UP]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_PREVIOUS]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_DOWN]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_UP]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_MUTE]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.DOWN]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.UP]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.LEFT]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.RIGHT]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.ENTER]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.MENU]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.TOOLS]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.RETURN]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.GUIDE]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.EXIT]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.PLAY]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.PAUSE]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.STOP]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.PREVIOUS]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.NEXT]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.FORWARD]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.REWIND]: {},
    [DEVICE_FEATURE_TYPES.TELEVISION.RECORD]: {}
  }
};

export const MANAGED_CATEGORIES = Object.keys(MANAGED_FEATURES);
