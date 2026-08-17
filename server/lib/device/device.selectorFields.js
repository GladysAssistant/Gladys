// Fields carrying selectors in scene actions/triggers and dashboard boxes.
// This list is a contract with the Joi schemas of models/scene.js and
// models/dashboard.js (see docs/specs/device-migration.md, B.3).
//
// It lives here because two features read it: device.migrate rewrites those
// selectors, and device.getUsage looks them up to know where a device is used.
// A new device-referencing box or action field must be added once, here, so the
// two cannot drift apart.
const FEATURE_STRING_FIELDS = ['device_feature'];
const FEATURE_ARRAY_FIELDS = ['device_features'];
const DEVICE_STRING_FIELDS = ['device', 'camera'];
const DEVICE_ARRAY_FIELDS = ['devices'];

module.exports = {
  FEATURE_STRING_FIELDS,
  FEATURE_ARRAY_FIELDS,
  DEVICE_STRING_FIELDS,
  DEVICE_ARRAY_FIELDS,
};
