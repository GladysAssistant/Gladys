import get from 'get-value';

import { getCustomFeatureName } from '../light/lightFeatures';

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  VACUUM_CLEANER_MODE,
  VACUUM_CLEANER_STATE
} from '../../../../../../../server/utils/constants';

// The color the state icon of a robot takes, so the row reads at a glance: moving (cleaning, back
// to its base), waiting for its user (paused) or in trouble. A robot standing still keeps the
// neutral icon of every other row.
const STATE_COLORS = {
  [VACUUM_CLEANER_STATE.RUNNING]: '#2e8f5b',
  [VACUUM_CLEANER_STATE.RETURNING_TO_DOCK]: '#467fcf',
  [VACUUM_CLEANER_STATE.PAUSED]: '#f59f00',
  [VACUUM_CLEANER_STATE.ERROR]: '#cd201f'
};

// The features of a same robot are grouped by their device, with the same key as the light
// grouping: the id always comes with the device the widget expands, the selector is a fallback.
const getDeviceKey = feature => get(feature, 'device.id') || get(feature, 'device.selector');

/**
 * @description Tells if a device feature belongs to the vacuum cleaner category.
 * @param {object} feature - The device feature to test.
 * @returns {boolean} True for a vacuum cleaner feature.
 * @example isVacuumFeature({ category: 'vacuum-cleaner', type: 'state' });
 */
export const isVacuumFeature = feature => feature.category === DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER;

/**
 * @description Finds the first feature of a category and type among the features of a robot.
 * @param {Array} features - The features of one robot.
 * @param {string} category - The device feature category.
 * @param {string} type - The device feature type.
 * @returns {object} The matching feature, or undefined.
 * @example getVacuumFeature(features, 'vacuum-cleaner', 'state');
 */
export const getVacuumFeature = (features, category, type) =>
  features.find(feature => feature.category === category && feature.type === type);

/**
 * @description Picks the features the robot row itself shows or controls: its state, its battery
 * level, its run mode (start / stop) and its dock button — the first of each, a duplicate is left
 * to the panel like any other feature.
 * @param {Array} features - The features of one robot, in display order.
 * @returns {object} The features found, each one possibly undefined.
 * @example getVacuumRowFeatures(features);
 */
export const getVacuumRowFeatures = features => ({
  state: getVacuumFeature(
    features,
    DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
    DEVICE_FEATURE_TYPES.VACUUM_CLEANER.STATE
  ),
  runMode: getVacuumFeature(
    features,
    DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
    DEVICE_FEATURE_TYPES.VACUUM_CLEANER.RUN_MODE
  ),
  dock: getVacuumFeature(features, DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER, DEVICE_FEATURE_TYPES.VACUUM_CLEANER.DOCK),
  // The charge level only: a battery category also carries the binary "charging" feature.
  battery: getVacuumFeature(features, DEVICE_FEATURE_CATEGORIES.BATTERY, DEVICE_FEATURE_TYPES.BATTERY.INTEGER)
});

/**
 * @description Tells if a robot is cleaning, so its row offers to stop it rather than to start it.
 * The run mode says what was asked, the state what the robot does: either one is enough.
 * @param {object} rowFeatures - The result of getVacuumRowFeatures.
 * @returns {boolean} True while the robot cleans.
 * @example isVacuumCleaning(getVacuumRowFeatures(features));
 */
export const isVacuumCleaning = ({ state, runMode }) =>
  Boolean(
    (runMode && runMode.last_value === VACUUM_CLEANER_MODE.CLEANING) ||
      (state && state.last_value === VACUUM_CLEANER_STATE.RUNNING)
  );

/**
 * @description Gives the color of the state icon of a robot, if its state calls for one.
 * @param {object} stateFeature - The state feature of the robot.
 * @returns {string} A CSS color, or undefined for a robot standing still.
 * @example getVacuumStateColor({ last_value: 1 });
 */
export const getVacuumStateColor = stateFeature => (stateFeature ? STATE_COLORS[stateFeature.last_value] : undefined);

/**
 * @description Gives the state of a robot in words, from the translated values of its state
 * feature — or of its run mode when no state feature was picked in the widget.
 * @param {object} dictionary - The i18n dictionary.
 * @param {object} rowFeatures - The result of getVacuumRowFeatures.
 * @returns {string} The state, or undefined when the widget shows neither feature.
 * @example getVacuumStateText(dictionary, getVacuumRowFeatures(features));
 */
export const getVacuumStateText = (dictionary, { state, runMode }) => {
  const feature = state || runMode;
  if (!feature || feature.last_value === null || feature.last_value === undefined) {
    return undefined;
  }
  const values = get(dictionary, `deviceFeatureValue.category.${feature.category}.${feature.type}`) || {};
  if (values[feature.last_value]) {
    return values[feature.last_value];
  }
  return (values.unknown || '{{value}}').replace('{{value}}', feature.last_value);
};

/**
 * @description Gives the name of a robot row: a name the user typed in the widget editor on one of
 * the robot's own vacuum cleaner features wins, as for a grouped light. A name typed on its battery
 * or on one of its settings names that feature, not the robot.
 * @param {object} dictionary - The i18n dictionary.
 * @param {object} device - The device of the robot.
 * @param {Array} features - The features of that robot, in display order.
 * @returns {string} The name to display on the row and in the panel.
 * @example getVacuumName(dictionary, device, features);
 */
export const getVacuumName = (dictionary, device, features) => {
  const customNames = features
    .filter(isVacuumFeature)
    .map(feature => getCustomFeatureName(dictionary, device, feature))
    .filter(Boolean);
  return customNames.length > 0 ? customNames[0] : device.name;
};

/**
 * @description Gives the label of a feature inside the panel of its robot: the panel is already
 * titled with the robot, so a row says what it controls ("Suction power"), not "Robot (Suction
 * power)" — unless the user typed a name of their own in the widget editor.
 * @param {object} dictionary - The i18n dictionary.
 * @param {object} device - The device of the robot.
 * @param {object} feature - The device feature.
 * @returns {string} The label of the row.
 * @example getVacuumPanelLabel(dictionary, device, feature);
 */
export const getVacuumPanelLabel = (dictionary, device, feature) =>
  getCustomFeatureName(dictionary, device, feature) || feature.name;

/**
 * @description Groups the rows of a robot vacuum into a single row: every feature of a same device
 * shown by the widget — its state, battery and controls, but also its settings and maintenance —
 * when at least one of them is a vacuum cleaner feature and the widget shows at least two of them.
 * The group takes the place of the first row of its device, so the order the user configured is
 * kept; every other row is returned untouched. A robot shown through a single feature keeps the
 * plain row it has always had.
 * @param {Array} rows - The rows built by buildDeviceRows, in display order.
 * @param {Array} deviceFeatures - The device features displayed by the widget, in display order.
 * @returns {Array} The rows to render, a robot row carrying `vacuum: true` and its `entries`
 * (`{ deviceFeature, index }`, index being the position of the feature in the widget).
 * @example groupVacuumRows(buildDeviceRows(deviceFeatures), deviceFeatures);
 */
export const groupVacuumRows = (rows = [], deviceFeatures = []) => {
  const featuresOfRow = row => row.features || [row.deviceFeature];
  const featureCountByDevice = {};
  const vacuumDeviceIds = new Set();
  deviceFeatures.forEach(feature => {
    const deviceId = getDeviceKey(feature);
    if (!deviceId) {
      return;
    }
    featureCountByDevice[deviceId] = (featureCountByDevice[deviceId] || 0) + 1;
    if (isVacuumFeature(feature)) {
      vacuumDeviceIds.add(deviceId);
    }
  });
  const isGrouped = deviceId => vacuumDeviceIds.has(deviceId) && featureCountByDevice[deviceId] >= 2;

  const groupedRows = [];
  const vacuumRowByDeviceId = {};
  rows.forEach(row => {
    const features = featuresOfRow(row);
    const deviceId = getDeviceKey(features[0]);
    if (!deviceId || !isGrouped(deviceId)) {
      groupedRows.push(row);
      return;
    }
    let vacuumRow = vacuumRowByDeviceId[deviceId];
    if (!vacuumRow) {
      vacuumRow = {
        key: `vacuum-${deviceId}`,
        index: row.index,
        device: features[0].device,
        vacuum: true,
        entries: []
      };
      vacuumRowByDeviceId[deviceId] = vacuumRow;
      groupedRows.push(vacuumRow);
    }
    // The position of each feature in the widget keeps the inputs of the panel rows unique, as on
    // the rows they replace.
    features.forEach(deviceFeature => {
      vacuumRow.entries.push({ deviceFeature, index: deviceFeatures.indexOf(deviceFeature) });
    });
  });
  return groupedRows;
};
