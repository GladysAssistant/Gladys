import uuid from 'uuid';
import models from '../../../../../../../server/services/sonoff/models';

export const Models = {
  basic: 1,
  pow: 6,
  s26: 8
};

export const GetFeatures = (modelName, deviceName, deviceTopic) => {
  if (models[modelName]) {
    return models[modelName].getFeatures(uuid, deviceName, deviceTopic);
  }

  return [];
};
