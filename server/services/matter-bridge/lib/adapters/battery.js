const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { isNumber, toBattery } = require('../converters');
const { BAT_CHARGE_LEVEL, POWER_SOURCE_STATUS } = require('../constants');
const { isFeature } = require('./helpers');

// The battery is not a function of its own: it is a Matter power source cluster added to the
// endpoint of the device, next to whatever the device does.
const battery = {
  key: 'battery',
  claim(features) {
    const level = features.find((f) =>
      isFeature(f, DEVICE_FEATURE_CATEGORIES.BATTERY, [DEVICE_FEATURE_TYPES.BATTERY.INTEGER]),
    );
    return level ? [{ level }] : [];
  },
  behavior(matter) {
    return matter.behaviors.PowerSourceServer.with('Battery');
  },
  state(roles, ctx) {
    const value = ctx.read(roles.level);
    return {
      powerSource: {
        status: POWER_SOURCE_STATUS.ACTIVE,
        order: 0,
        description: 'Battery',
        batReplaceability: 0,
        ...(isNumber(value) ? toBattery(value) : { batPercentRemaining: null, batChargeLevel: BAT_CHARGE_LEVEL.OK }),
      },
    };
  },
  // Some Matter device types (the smoke and CO alarm) must say how they are powered. A device
  // without a battery feature is taken as mains powered.
  wiredBehavior(matter) {
    return matter.behaviors.PowerSourceServer.with('Wired');
  },
  wiredState() {
    return { powerSource: { status: POWER_SOURCE_STATUS.ACTIVE, order: 0, description: 'Mains' } };
  },
  toMatter(role, value) {
    return { powerSource: toBattery(value) };
  },
  listeners: [],
};

module.exports = battery;
