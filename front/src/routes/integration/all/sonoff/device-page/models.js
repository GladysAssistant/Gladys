import models from '../../../../../../../server/services/sonoff/models';
import { DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';

export const Models = {};
Object.keys(models).forEach(modelKey => {
  Models[models[modelKey].getModel()] = modelKey;
});

export const getFeatures = modelName => {
  const modelKey = Models[modelName];
  if (modelKey && models[modelKey]) {
    return models[modelKey].getFeatures();
  }

  return [];
};

export const fillFeatures = device => {
  const modelKey = Models[device.model];
  if (modelKey && models[modelKey] && models[modelKey].fillFeatures) {
    models[modelKey].fillFeatures(device);
  } else {
    device.features.forEach(feature => {
      feature.name = device.name;
      if (DEVICE_FEATURE_TYPES.SWITCH.BINARY !== feature.type) {
        feature.name += ` - ${feature.type}`;
      }
      feature.external_id = `${device.external_id}:${feature.category}:${feature.type}`;
      feature.selector = feature.external_id;
    });
  }
};
