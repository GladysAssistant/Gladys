const { RemoteKeyCode, RemoteDirection } = require('androidtv-remote');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const keyMappings = {
  [DEVICE_FEATURE_CATEGORIES.TELEVISION]: {
    [DEVICE_FEATURE_TYPES.TELEVISION.BINARY]: {
      KeyCode: RemoteKeyCode.KEYCODE_POWER,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_DOWN]: {
      KeyCode: RemoteKeyCode.KEYCODE_VOLUME_DOWN,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_UP]: {
      KeyCode: RemoteKeyCode.KEYCODE_VOLUME_UP,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_MUTE]: {
      KeyCode: RemoteKeyCode.KEYCODE_VOLUME_MUTE,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME]: {
      KeyCode: [RemoteKeyCode.KEYCODE_VOLUME_DOWN, RemoteKeyCode.KEYCODE_VOLUME_UP],
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.DOWN]: {
      KeyCode: RemoteKeyCode.KEYCODE_DPAD_DOWN,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.UP]: {
      KeyCode: RemoteKeyCode.KEYCODE_DPAD_UP,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.LEFT]: {
      KeyCode: RemoteKeyCode.KEYCODE_DPAD_LEFT,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.RIGHT]: {
      KeyCode: RemoteKeyCode.KEYCODE_DPAD_RIGHT,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.ENTER]: {
      KeyCode: RemoteKeyCode.KEYCODE_DPAD_CENTER,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.MENU]: {
      KeyCode: RemoteKeyCode.KEYCODE_MENU,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.RETURN]: {
      KeyCode: RemoteKeyCode.KEYCODE_BACK,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.GUIDE]: {
      KeyCode: RemoteKeyCode.KEYCODE_GUIDE,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.PLAY]: {
      KeyCode: RemoteKeyCode.KEYCODE_MEDIA_PLAY,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.PAUSE]: {
      KeyCode: RemoteKeyCode.KEYCODE_MEDIA_PAUSE,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.STOP]: {
      KeyCode: RemoteKeyCode.KEYCODE_MEDIA_STOP,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.FORWARD]: {
      KeyCode: RemoteKeyCode.KEYCODE_MEDIA_FAST_FORWARD,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.REWIND]: {
      KeyCode: RemoteKeyCode.KEYCODE_MEDIA_REWIND,
      Direction: RemoteDirection.SHORT,
    },
    [DEVICE_FEATURE_TYPES.TELEVISION.RECORD]: {
      KeyCode: RemoteKeyCode.KEYCODE_MEDIA_RECORD,
      Direction: RemoteDirection.SHORT,
    },
  }
};

const appMappings = {
  'com.google.android.tvlauncher': 'Home',
  'com.google.android.youtube.tv': 'YouTube',
  'com.android.vending': 'Play Store',
  'com.android.tv.settings': 'Settings'
};

module.exports = { keyMappings, appMappings };
