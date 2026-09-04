import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  THERMOSTAT_OPERATING_STATE
} from '../../../../../server/utils/constants';

/**
 * Whether an external thermostat is currently running its equipment.
 *
 * No integration produces `thermostat`/`operating-state` yet: Netatmo publishes
 * its boiler contact as a read-only `switch`/`binary`, and Zigbee, Matter and
 * MQTT publish nothing at all. Accepting only the standard type would leave
 * every real thermostat without a heating halo, so both shapes are read here.
 *
 * Returns null when the state is unknown, which is what the widget falls back
 * on to estimate the state from the setpoint instead.
 */
export const isRunningFromStateFeature = (feature, value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  const isOperatingState =
    feature &&
    feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT &&
    feature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE;
  if (isOperatingState) {
    // Idle is the only state where nothing runs: both heating and cooling mean
    // the equipment is on.
    return numeric !== THERMOSTAT_OPERATING_STATE.IDLE;
  }
  return numeric === 1;
};
