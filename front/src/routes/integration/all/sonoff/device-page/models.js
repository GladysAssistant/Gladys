import uuid from 'uuid';
import models from '../../../../../../../server/services/sonoff/models';

export const Models = {
  'sonoff-basic': 1,
  'sonoff-pow': 6,
  'sonoff-s2x': 8
};

export const GetFeatures = (modelName, deviceName, deviceTopic) => {
  const modelKey = Models[modelName];
  if (modelKey && models[modelKey]) {
    return models[modelKey].getFeatures(uuid, deviceName, deviceTopic);
  }

  return [];
};
