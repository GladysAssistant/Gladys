import uuid from 'uuid';
import { featureConverter } from '../../../../../../../server/services/sonoff/utils/featureConverter';

export const Models = {
  basic: 1,
  pow: 6,
  s26: 8
};

export const GetFeatures = (modelName, deviceName, deviceTopic) => {
  return featureConverter(uuid, Models[modelName], deviceName, deviceTopic);
};
