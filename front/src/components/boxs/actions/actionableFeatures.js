import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

// The quick-actions contract (spec B2) knows exactly two device commands:
// toggling a writable binary feature, and sending a cover-state command to a
// shutter/curtain. The picker only offers these, and the runtime refuses
// anything else — a dashboard is editable by any authenticated user and can
// hang on a public wall panel, so a mis-wired pill must never become a blind
// write to a thermostat, dimmer or sensor.

const isCoverStateFeature = feature =>
  Boolean(feature) &&
  !feature.read_only &&
  (feature.category === DEVICE_FEATURE_CATEGORIES.SHUTTER || feature.category === DEVICE_FEATURE_CATEGORIES.CURTAIN) &&
  feature.type === DEVICE_FEATURE_TYPES.SHUTTER.STATE;

const isToggleableBinaryFeature = feature =>
  Boolean(feature) && !feature.read_only && feature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY;

const isActionableFeature = feature => isToggleableBinaryFeature(feature) || isCoverStateFeature(feature);

export { isCoverStateFeature, isToggleableBinaryFeature, isActionableFeature };
