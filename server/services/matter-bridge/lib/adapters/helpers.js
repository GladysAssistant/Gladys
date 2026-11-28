const { isNumber } = require('../converters');

/**
 * @description Tell if a Gladys feature is of one of the given category and types.
 * @param {object} feature - Gladys feature.
 * @param {string} category - Gladys feature category.
 * @param {Array<string>} types - Accepted Gladys feature types.
 * @returns {boolean} True when the feature matches.
 * @example
 * isFeature(feature, 'light', ['binary']);
 */
function isFeature(feature, category, types) {
  return feature.category === category && types.includes(feature.type);
}

/**
 * @description Tell if Gladys can set a feature. Matter apps may write any feature a device type
 * controls, so a read-only feature, which only reports its value, must not be one of them: the
 * device would show a control that fails.
 * @param {object} feature - Gladys feature.
 * @returns {boolean} True when the feature is not read-only.
 * @example
 * isWritable({ read_only: false }); // true
 */
function isWritable(feature) {
  return !feature.read_only;
}

/**
 * @description Pair the features of each role into groups, one Matter function per group: the
 * first light switch goes with the first brightness, the second with the second, and so on.
 * @param {object} featuresByRole - Features of the device, grouped by the role they play.
 * @returns {Array<object>} Groups, each mapping a role to its feature. A role with fewer features
 * than the others is simply absent from the last groups.
 * @example
 * zipRoles({ binary: [b1, b2], brightness: [l1] }); // [{ binary: b1, brightness: l1 }, { binary: b2 }]
 */
function zipRoles(featuresByRole) {
  const size = Math.max(0, ...Object.values(featuresByRole).map((features) => features.length));
  const groups = [];
  for (let i = 0; i < size; i += 1) {
    const group = {};
    Object.entries(featuresByRole).forEach(([role, features]) => {
      if (features[i]) {
        group[role] = features[i];
      }
    });
    groups.push(group);
  }
  return groups;
}

/**
 * @description Merge partial endpoint states, cluster by cluster.
 * @param {...object} states - Partial states, as { cluster: { attribute: value } }.
 * @returns {object} The merged state.
 * @example
 * mergeState({ onOff: { onOff: true } }, { levelControl: { currentLevel: 254 } });
 */
function mergeState(...states) {
  return states.reduce((merged, state) => {
    Object.entries(state).forEach(([cluster, attributes]) => {
      merged[cluster] = { ...merged[cluster], ...attributes };
    });
    return merged;
  }, {});
}

/**
 * @description Build an adapter for a sensor exposing one Gladys feature as one Matter endpoint
 * with one measured attribute. Most Matter sensors are exactly that.
 * @param {object} definition - Sensor definition.
 * @param {string} definition.key - Adapter key, also used in the endpoint ids.
 * @param {Array} definition.matches - Accepted [category, types] pairs.
 * @param {Function} definition.deviceType - Gets the matter.js device type from the matter.js modules.
 * @param {Function} definition.initialState - State of the endpoint before any value is known.
 * @param {Function} definition.toState - Converts a Gladys value to a partial endpoint state.
 * @returns {object} The adapter.
 * @example
 * sensorAdapter({ key: 'humidity', matches, deviceType, initialState, toState });
 */
function sensorAdapter({ key, matches, deviceType, initialState, toState }) {
  return {
    key,
    claim(features) {
      return features
        .filter((feature) => matches.some(([category, types]) => isFeature(feature, category, types)))
        .map((feature) => ({ value: feature }));
    },
    build(matter, roles, ctx) {
      const value = ctx.read(roles.value);
      return {
        type: deviceType(matter),
        state: isNumber(value)
          ? mergeState(initialState(roles.value), toState(value, roles.value))
          : initialState(roles.value),
      };
    },
    toMatter(role, value, roles) {
      return toState(value, roles.value);
    },
    listeners: [],
  };
}

module.exports = {
  isFeature,
  isWritable,
  zipRoles,
  sensorAdapter,
  mergeState,
};
