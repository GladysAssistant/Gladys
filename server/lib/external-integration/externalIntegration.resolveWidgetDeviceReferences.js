const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Collect every device feature external_id referenced by a
 * normalized widget content (value / gauge / button `device_feature`, chart
 * `device_features`).
 * @param {Array} components - The normalized components.
 * @returns {Array<string>} The referenced external_ids, deduplicated.
 * @example
 * const externalIds = collectDeviceReferences(components);
 */
function collectDeviceReferences(components) {
  const references = new Set();
  components.forEach((component) => {
    if (component.device_feature !== undefined) {
      references.add(component.device_feature);
    }
    if (Array.isArray(component.device_features)) {
      component.device_features.forEach((reference) => references.add(reference));
    }
  });
  return [...references];
}

/**
 * @description Resolve the live device bindings of a normalized widget
 * content WITHIN THE TENANT (section 8 of capabilities/dashboard-widgets.md):
 * every referenced external_id must be a feature of a device of this
 * integration's t_service, else the component is dropped with a warning — a
 * widget never displays, charts or actuates another integration's or the
 * core's data. Each accepted reference is kept as sent and completed with its
 * resolution (`device_feature_selector`, `device_feature_selectors`), the
 * only thing the frontend ever uses. A `button` additionally requires a
 * writable feature and a value within its range; a `gauge` inherits the
 * feature's range when the content declares none.
 * @param {object} service - The external integration service.
 * @param {Array} components - The normalized components (content order).
 * @returns {Promise<Array>} The components with their references resolved.
 * @example
 * const components = await resolveWidgetDeviceReferences(service, content.components);
 */
async function resolveWidgetDeviceReferences(service, components) {
  const references = collectDeviceReferences(components);
  if (references.length === 0) {
    return components;
  }
  const features = await db.DeviceFeature.findAll({
    attributes: ['external_id', 'selector', 'read_only', 'min', 'max'],
    where: { external_id: references },
    include: [
      {
        model: db.Device,
        as: 'device',
        attributes: ['service_id'],
        where: { service_id: service.id },
      },
    ],
  });
  const featuresByExternalId = new Map();
  features.forEach((feature) => {
    featuresByExternalId.set(feature.external_id, feature.get({ plain: true }));
  });
  const drop = (component, reason) => {
    logger.warn(
      `Widget content ${service.selector}: dropping ${component.type} component bound to a device feature (${reason})`,
    );
    return null;
  };
  return components
    .map((component) => {
      if (component.type === 'chart' && Array.isArray(component.device_features)) {
        const selectors = component.device_features.map((reference) => {
          const feature = featuresByExternalId.get(reference);
          return feature ? feature.selector : null;
        });
        if (selectors.some((selector) => selector === null)) {
          return drop(component, 'a feature is not one of this integration');
        }
        return { ...component, device_feature_selectors: selectors };
      }
      if (component.device_feature === undefined) {
        return component;
      }
      const feature = featuresByExternalId.get(component.device_feature);
      if (!feature) {
        return drop(component, 'the feature is not one of this integration');
      }
      if (component.type === 'button') {
        if (feature.read_only) {
          return drop(component, 'the feature is read-only');
        }
        const belowMin = feature.min !== null && feature.min !== undefined && component.value < feature.min;
        const aboveMax = feature.max !== null && feature.max !== undefined && component.value > feature.max;
        if (belowMin || aboveMax) {
          return drop(component, 'the value is outside the feature range');
        }
      }
      const resolved = { ...component, device_feature_selector: feature.selector };
      if (component.type === 'gauge' && component.min === undefined && component.max === undefined) {
        // the range of the feature itself, when the content declares none
        if (typeof feature.min === 'number' && typeof feature.max === 'number' && feature.min < feature.max) {
          resolved.min = feature.min;
          resolved.max = feature.max;
        }
      }
      return resolved;
    })
    .filter((component) => component !== null);
}

module.exports = {
  resolveWidgetDeviceReferences,
  collectDeviceReferences,
};
