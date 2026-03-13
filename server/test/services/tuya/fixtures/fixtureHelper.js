const fs = require('fs');
const { createRequire } = require('module');
const path = require('path');

const FIXTURES_ROOT = path.join(__dirname, 'devices');
const fixtureRequire = createRequire(__filename);

const sortByKey = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortByKey).sort((left, right) => {
      const leftKey = JSON.stringify(left);
      const rightKey = JSON.stringify(right);
      return leftKey.localeCompare(rightKey);
    });
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortByKey(value[key]);
        return accumulator;
      }, {});
  }
  return value;
};

const loadJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8'));

const omitUndefined = (value) =>
  Object.keys(value).reduce((accumulator, key) => {
    if (value[key] !== undefined) {
      accumulator[key] = value[key];
    }
    return accumulator;
  }, {});

const normalizeParams = (params) =>
  (Array.isArray(params) ? params : []).reduce((accumulator, param) => {
    accumulator[param.name] = param.value;
    return accumulator;
  }, {});

const normalizeFeatures = (features) =>
  sortByKey(
    (Array.isArray(features) ? features : []).map((feature) => {
      const normalized = omitUndefined({
        name: feature.name,
        external_id: feature.external_id,
        selector: feature.selector,
        category: feature.category,
        type: feature.type,
        read_only: feature.read_only,
        has_feedback: feature.has_feedback,
        min: feature.min,
        max: feature.max,
      });

      if (feature.unit !== undefined) {
        normalized.unit = feature.unit;
      }
      if (feature.scale !== undefined) {
        normalized.scale = feature.scale;
      }
      return normalized;
    }),
  );

const normalizeConvertedDevice = (device) =>
  omitUndefined({
    name: device.name,
    external_id: device.external_id,
    selector: device.selector,
    device_type: device.device_type,
    model: device.model,
    product_id: device.product_id,
    product_key: device.product_key,
    online: device.online,
    poll_frequency: device.poll_frequency,
    should_poll: device.should_poll,
    params: normalizeParams(device.params),
    tuya_mapping: sortByKey(device.tuya_mapping),
    features: normalizeFeatures(device.features),
  });

const normalizeEvents = (calls) =>
  sortByKey(
    calls.map((call) => ({
      device_feature_external_id: call.args[1].device_feature_external_id,
      state: call.args[1].state,
    })),
  );

const loadFixtureCases = (sectionName) =>
  fs
    .readdirSync(FIXTURES_ROOT)
    .sort()
    .filter((directoryName) => fs.statSync(path.join(FIXTURES_ROOT, directoryName)).isDirectory())
    .map((directoryName) => {
      const fixtureDirectory = path.join(FIXTURES_ROOT, directoryName);
      const manifest = fixtureRequire(path.join(fixtureDirectory, 'manifest.js'));
      if (!manifest[sectionName]) {
        return null;
      }
      return {
        directoryName,
        fixtureDirectory,
        manifest,
        load(relativePath) {
          return loadJson(path.join(fixtureDirectory, relativePath));
        },
      };
    })
    .filter(Boolean);

module.exports = {
  loadFixtureCases,
  normalizeConvertedDevice,
  normalizeEvents,
  omitUndefined,
  sortByKey,
};
