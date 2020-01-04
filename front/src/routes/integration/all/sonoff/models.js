import models from '../../../../../../server/services/sonoff/models';
import { DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

export const Models = {};
Object.keys(models).forEach(modelKey => {
  Models[models[modelKey].getModel()] = models[modelKey];
});

export const fillFeatures = device => {
  const model = Models[device.model];
  if (model && model.fillFeatures) {
    model.fillFeatures(device);
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
