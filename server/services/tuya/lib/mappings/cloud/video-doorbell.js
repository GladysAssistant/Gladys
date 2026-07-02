const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../utils/constants');

// Wifi video doorbell (Tuya category "sp").
// Scope: only the writable boolean settings are exposed for now — they map cleanly to switch/binary
// toggles usable from scenes. Everything else is deferred (see ignoredCodes):
//  - doorbell_active: the ring is an event (cloud value is an empty string when idle) and typically
//    carries the snapshot; it belongs with the camera work (PR10-Bis), not a pollable binary. It is
//    still declared as a REQUIRED_CODE in mappings/index.js so it drives device-type matching.
//  - sd_format_state / sd_status: numeric status codes (not booleans).
//  - motion_sensitivity / record_mode / basic_nightvision: enums needing a select UI (follow-up).
//  - basic_device_volume: numeric volume (follow-up).
//  - sd_storge / sd_format: storage string / maintenance action (follow-up).
//  - doorbell_pic / movement_detect_pic: camera snapshots (PR10-Bis).
module.exports = {
  ignoredCodes: [
    'doorbell_active',
    'sd_format_state',
    'sd_status',
    'motion_sensitivity',
    'record_mode',
    'basic_nightvision',
    'basic_device_volume',
    'sd_storge',
    'sd_format',
    'doorbell_pic',
    'movement_detect_pic',
  ],
  motion_switch: {
    name: 'Motion detection',
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  record_switch: {
    name: 'Recording',
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  basic_flip: {
    name: 'Image flip',
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  basic_indicator: {
    name: 'Status LED',
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  basic_osd: {
    name: 'On-screen display',
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
};
