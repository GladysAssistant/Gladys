import models from '../../../../../../server/services/tasmota/models';

export const Models = {};
Object.keys(models).forEach(modelKey => {
  Models[models[modelKey].getModel()] = models[modelKey];
});

export const getLabel = modelKey => {
  if (Models[modelKey]) {
    return Models[modelKey].getLabel();
  }

  return modelKey;
};
