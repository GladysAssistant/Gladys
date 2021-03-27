import { DEVICE_FEATURE_CATEGORIES } from '../../../../../server/utils/constants';
import television from './television/template';
import light from './light/template';

export default {
  [DEVICE_FEATURE_CATEGORIES.TELEVISION]: television,
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: light
};
