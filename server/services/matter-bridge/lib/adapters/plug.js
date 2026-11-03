const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { isFeature } = require('./helpers');

// A plug, a relay or one gang of a wall switch: each Gladys switch is its own Matter plug-in unit.
// Read-only switches report a state they cannot be told to change, so they are not offered as
// something Matter could turn on.
const plug = {
  key: 'plug',
  claim(features) {
    return features
      .filter(
        (feature) =>
          isFeature(feature, DEVICE_FEATURE_CATEGORIES.SWITCH, [DEVICE_FEATURE_TYPES.SWITCH.BINARY]) &&
          !feature.read_only,
      )
      .map((feature) => ({ binary: feature }));
  },
  build(matter, roles, ctx) {
    return {
      type: matter.devices.OnOffPlugInUnitDevice,
      state: { onOff: { onOff: ctx.read(roles.binary) === 1 } },
    };
  },
  toMatter(role, value) {
    return { onOff: { onOff: value === 1 } };
  },
  listeners: [
    {
      cluster: 'onOff',
      attribute: 'onOff',
      role: 'binary',
      toGladys: (state) => (state.onOff.onOff ? 1 : 0),
    },
  ],
};

module.exports = plug;
