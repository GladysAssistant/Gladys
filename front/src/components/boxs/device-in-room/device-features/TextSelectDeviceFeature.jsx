import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import AdaptiveOptionControl from './AdaptiveOptionControl';

/**
 * A select among string values the integration discovered on the appliance itself
 * (installed TV apps, HDMI sources...). There is no static catalog to fall back to:
 * the feature's supported_options are the whole list, with the labels the device gave
 * them, and the current selection lives in last_value_string.
 */
const TextSelectDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;

  const options = resolveFeatureOptions(deviceFeature, []);
  const updateValue = value => props.updateValueWithDebounce(deviceFeature, `${value}`);

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'list' })}`} />
      </td>
      <td>{props.rowName}</td>
      <AdaptiveOptionControl
        options={options}
        value={deviceFeature.last_value_string}
        category={category}
        type={type}
        updateValue={updateValue}
      />
    </tr>
  );
};

export default TextSelectDeviceFeature;
