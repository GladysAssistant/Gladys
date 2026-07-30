import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { AC_MODE } from '../../../../../../server/utils/constants';
import AdaptiveOptionControl from './AdaptiveOptionControl';

const MODE_OPTIONS = [
  { value: AC_MODE.AUTO, i18nKey: 'auto' },
  { value: AC_MODE.COOLING, i18nKey: 'cooling' },
  { value: AC_MODE.HEATING, i18nKey: 'heating' },
  { value: AC_MODE.DRYING, i18nKey: 'drying' },
  { value: AC_MODE.FAN, i18nKey: 'fan' }
];

const AirConditioningModeDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  // Only offer the modes this AC supports (its supported_options); a feature without restrictions
  // keeps the full list. The control shows buttons when they fit on one line, a dropdown otherwise.
  const options = resolveFeatureOptions(deviceFeature, MODE_OPTIONS);
  const updateValue = value => props.updateValueWithDebounce(deviceFeature, value);

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'sliders' })}`} />
      </td>
      <td>{props.rowName}</td>
      <AdaptiveOptionControl
        options={options}
        value={lastValue}
        category={category}
        type={type}
        updateValue={updateValue}
      />
    </tr>
  );
};

export default AirConditioningModeDeviceFeature;
