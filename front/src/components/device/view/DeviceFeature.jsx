import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../utils/consts';

const DeviceFeature = ({ feature }) => (
  <span class="tag">
    <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
    <div class="tag-addon">
      <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
    </div>
  </span>
);

export default DeviceFeature;
