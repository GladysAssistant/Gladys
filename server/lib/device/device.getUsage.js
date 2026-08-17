const { Op } = require('sequelize');
const db = require('../../models');

// Keys, in dashboard boxes and in scene actions/triggers, whose value is a
// device selector (or an array of device selectors)
const DEVICE_SELECTOR_KEYS = ['device', 'devices', 'camera'];
// Keys whose value is a device feature selector (or an array of them)
const DEVICE_FEATURE_SELECTOR_KEYS = ['device_feature', 'device_features'];

const DASHBOARD_FIELDS = ['id', 'name', 'selector', 'type'];
const SCENE_FIELDS = ['id', 'name', 'selector', 'icon'];

/**
 * @description Add a value (a selector or an array of selectors) to a set of selectors.
 * Values that are not selectors are harmless: they are dropped later, when the
 * collected selectors are matched against the devices existing in database.
 * @param {Set<string>} selectors - Set collecting the selectors found.
 * @param {any} value - Value read from the JSON document.
 * @example
 * addSelectors(new Set(), 'test-device');
 */
function addSelectors(selectors, value) {
  if (Array.isArray(value)) {
    value.forEach((item) => selectors.add(item));
  } else {
    selectors.add(value);
  }
}

/**
 * @description Walk a JSON document and collect device & device feature selectors.
 * Scene actions can be nested (if/then/else blocks), so the walk is recursive.
 * @param {any} node - Current node of the JSON document.
 * @param {object} found - Accumulator with a `devices` and a `features` Set.
 * @example
 * collectSelectors(dashboard.boxes, { devices: new Set(), features: new Set() });
 */
function collectSelectors(node, found) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectSelectors(item, found));
    return;
  }
  if (node === null || typeof node !== 'object') {
    return;
  }
  Object.keys(node).forEach((key) => {
    const value = node[key];
    if (DEVICE_SELECTOR_KEYS.includes(key)) {
      addSelectors(found.devices, value);
    } else if (DEVICE_FEATURE_SELECTOR_KEYS.includes(key)) {
      addSelectors(found.features, value);
    }
    collectSelectors(value, found);
  });
}

/**
 * @description Resolve, for one JSON document, the selectors of the devices it references.
 * @param {any} json - JSON document (dashboard boxes, scene actions or scene triggers).
 * @param {Set<string>} knownDeviceSelectors - Selectors of the devices existing in database.
 * @param {Map<string, string>} deviceSelectorByFeature - Device selector indexed by feature selector.
 * @returns {Set<string>} Selectors of the devices referenced by this document.
 * @example
 * resolveDeviceSelectors(scene.actions, new Set(['test-device']), new Map());
 */
function resolveDeviceSelectors(json, knownDeviceSelectors, deviceSelectorByFeature) {
  const found = { devices: new Set(), features: new Set() };
  collectSelectors(json, found);
  const deviceSelectors = new Set();
  found.devices.forEach((selector) => {
    if (knownDeviceSelectors.has(selector)) {
      deviceSelectors.add(selector);
    }
  });
  found.features.forEach((featureSelector) => {
    const deviceSelector = deviceSelectorByFeature.get(featureSelector);
    if (deviceSelector) {
      deviceSelectors.add(deviceSelector);
    }
  });
  return deviceSelectors;
}

/**
 * @description Get, for each device, the dashboards and the scenes using it.
 * A device is considered "used" as soon as the device itself or any of its
 * features is referenced. Only devices used somewhere are returned, so a
 * device missing from the response is used nowhere.
 * @param {string} userId - Id of the user asking (dashboards are per user).
 * @returns {Promise<object>} Resolve with an object indexed by device selector.
 * @example
 * const usage = await gladys.device.getUsage('0cd30aef-9c4e-4a23-88e3-3547971296e5');
 */
async function getUsage(userId) {
  const [devices, dashboards, scenes] = await Promise.all([
    db.Device.findAll({
      attributes: ['selector'],
      include: [
        {
          model: db.DeviceFeature,
          as: 'features',
          attributes: ['selector'],
        },
      ],
    }),
    db.Dashboard.findAll({
      attributes: [...DASHBOARD_FIELDS, 'boxes'],
      where: {
        // Same rule as dashboard.get: a user sees his own dashboards and the public ones
        [Op.or]: [{ user_id: userId }, { visibility: 'public' }],
      },
      order: [['position', 'ASC']],
    }),
    db.Scene.findAll({
      attributes: [...SCENE_FIELDS, 'actions', 'triggers'],
      order: [['name', 'ASC']],
    }),
  ]);

  const knownDeviceSelectors = new Set();
  const deviceSelectorByFeature = new Map();
  devices.forEach((device) => {
    const plainDevice = device.get({ plain: true });
    knownDeviceSelectors.add(plainDevice.selector);
    plainDevice.features.forEach((feature) => {
      deviceSelectorByFeature.set(feature.selector, plainDevice.selector);
    });
  });

  const usage = {};

  /**
   * @description Get (and create if needed) the usage entry of a device.
   * @param {string} deviceSelector - Selector of the device.
   * @returns {object} The usage entry of this device.
   * @example
   * getUsageEntry('test-device');
   */
  const getUsageEntry = (deviceSelector) => {
    if (!usage[deviceSelector]) {
      usage[deviceSelector] = { dashboards: [], scenes: [] };
    }
    return usage[deviceSelector];
  };

  dashboards.forEach((dashboard) => {
    const plainDashboard = dashboard.get({ plain: true });
    const deviceSelectors = resolveDeviceSelectors(plainDashboard.boxes, knownDeviceSelectors, deviceSelectorByFeature);
    deviceSelectors.forEach((deviceSelector) => {
      getUsageEntry(deviceSelector).dashboards.push({
        id: plainDashboard.id,
        name: plainDashboard.name,
        selector: plainDashboard.selector,
        type: plainDashboard.type,
      });
    });
  });

  scenes.forEach((scene) => {
    const plainScene = scene.get({ plain: true });
    const deviceSelectors = resolveDeviceSelectors(
      [plainScene.actions, plainScene.triggers],
      knownDeviceSelectors,
      deviceSelectorByFeature,
    );
    deviceSelectors.forEach((deviceSelector) => {
      getUsageEntry(deviceSelector).scenes.push({
        id: plainScene.id,
        name: plainScene.name,
        selector: plainScene.selector,
        icon: plainScene.icon,
      });
    });
  });

  return usage;
}

module.exports = {
  getUsage,
};
