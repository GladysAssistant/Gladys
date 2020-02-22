import models from '../../../../../../../server/services/sonoff/models';

export const Models = {
  'sonoff-basic': 1,
  'sonoff-pow': 6,
  'sonoff-s2x': 8
};

export const getFeatures = modelName => {
  const modelKey = Models[modelName];
  if (modelKey && models[modelKey]) {
    return models[modelKey].getFeatures();
  }

  return [];
};
