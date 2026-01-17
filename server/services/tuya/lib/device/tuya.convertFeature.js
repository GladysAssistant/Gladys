const logger = require('../../../../utils/logger');
const { mappings } = require('./tuya.deviceMapping');
/**
 * @description Transforms Tuya feature as Gladys feature.
 * @param {object} tuyaFunctions - Functions from Tuya.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * convertFeature({ code: 'switch', type: 'Boolean', values: '{}' }, 'tuya:device_id');
 */
function convertFeature(tuyaFunctions, externalId) {
  const { code, values, name, readOnly, type } = tuyaFunctions;

  const featuresCategoryAndType = mappings[code];

  if (!featuresCategoryAndType) {
    logger.warn(`Tuya function with "${code}" code is not managed`);
    return undefined;
  }

  const feature = {
    name,
    external_id: `${externalId}:${code}`,
    selector: `${externalId}:${code}`,
    read_only: readOnly,
    has_feedback: false,
    min: 0,
    max: 1,
    ...featuresCategoryAndType,
  };

  let valuesObject = {};
  try {
    valuesObject = JSON.parse(values);
  } catch (e) {
    logger.error(
      `Tuya function as unmappable "${values}" values on "${featuresCategoryAndType.category}/${featuresCategoryAndType.type}" type with "${code}" code`,
    );
  }
  let params = '';

  switch (type) {
    case 'Boolean':
      break;
    case 'Integer': {
      if ('min' in valuesObject) {
        feature.min = valuesObject.min;
      }
      if ('max' in valuesObject) {
        feature.max = valuesObject.max;
      }
      const step = 'step' in valuesObject ? valuesObject.step : 1;
      const unit = 'unit' in valuesObject ? valuesObject.unit : null;
      const scale = 'scale' in valuesObject ? valuesObject.scale : 1;
      params = `{ "step": ${step}, "unit": "${unit}", "scale": ${scale} }`;
      break;
    }
    case 'Enum': {
      if ('range' in valuesObject) {
        const enumValues = valuesObject.range;
        params = enumValues.map((val) => `'${val}'`).join(' | ');
      }
      feature.min = 0;
      feature.max = valuesObject.range.length - 1;
      break;
    }
    case 'String':
      break;
    default:
      logger.warn(`Tuya function with "${type}" type is not managed`);
      return undefined;
  }
  // DeviceManager.addParam(`${externalId}:${code}`, params).catch((err) => {
  //   logger.error(`Tuya function unable to add param for "${externalId}:${code}"`, err);
  // });
  if (Object.keys(params).length > 0) {
    feature.params = { name, value: params };
  }
  return feature;
}

module.exports = {
  convertFeature,
};
