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
  { value: AC_MODE.FAN, i18nKey: 'fan' },
];

const AirConditioningModeDeviceFeature = (props) => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  // Only offer the modes this AC supports. When the feature declares supported_options, they drive
  // the list. Otherwise (legacy features that never got supported_options), keep the historical
  // fallback: auto/cool/heat always, plus dry/fan only when the feature range (max) covers them —
  // so a cooling-only unit is not offered inactive dry/fan buttons after this update.
  const hasSupportedOptions =
    Array.isArray(deviceFeature.supported_options) && deviceFeature.supported_options.length > 0;
  const options = hasSupportedOptions
    ? resolveFeatureOptions(deviceFeature, MODE_OPTIONS)
    : MODE_OPTIONS.filter((option) => option.value <= AC_MODE.HEATING || option.value <= deviceFeature.max).map(
        (option) => ({ value: option.value, i18nKey: option.i18nKey }),
      );
  const updateValue = (value) => props.updateValueWithDebounce(deviceFeature, value);

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
