import { Text } from 'preact-i18n';
import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';

const BluetoothPeripheralFeatures = ({ children, device }) => {
  const { features = [] } = device;

  return (
    <div class="form-group">
      <label class="form-label">
        <Text id="integration.bluetooth.device.featuresLabel" />
      </label>
      <div>
        {features.length === 0 && (
          <div class="text-center font-italic">
            <Text id="integration.bluetooth.device.noFeatureDiscovered" />
          </div>
        )}
        {features.length > 0 &&
          (children || (
            <div class="tags">
              {features.map(feature => (
                <span class="tag">
                  <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                  <div class="tag-addon">
                    <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
                  </div>
                </span>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};

export default BluetoothPeripheralFeatures;
