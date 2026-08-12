import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { THERMOSTAT_MODE } from '../../../../../../server/utils/constants';
import AdaptiveOptionControl from './AdaptiveOptionControl';

const MODE_OPTIONS = [
  { value: THERMOSTAT_MODE.OFF, i18nKey: 'off' },
  { value: THERMOSTAT_MODE.HEATING, i18nKey: 'heating' },
  { value: THERMOSTAT_MODE.COOLING, i18nKey: 'cooling' },
  { value: THERMOSTAT_MODE.AUTO, i18nKey: 'auto' }
];

const ThermostatModeDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  // Only offer the modes this thermostat supports. When the feature declares supported_options,
  // they drive the list. Otherwise (legacy features that never got supported_options), keep a
  // conservative fallback: off/heat always (the main consumers of this category are heat-only
  // devices like radiators/floor heating), plus cool/auto only when the feature range (max)
  // covers them — so a heat-only thermostat is not offered an inactive Cool button.
  const hasSupportedOptions =
    Array.isArray(deviceFeature.supported_options) && deviceFeature.supported_options.length > 0;
  const options = hasSupportedOptions
    ? resolveFeatureOptions(deviceFeature, MODE_OPTIONS)
    : MODE_OPTIONS.filter(
        option => option.value <= THERMOSTAT_MODE.HEATING || option.value <= deviceFeature.max
      ).map(option => ({ value: option.value, i18nKey: option.i18nKey }));
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

export default ThermostatModeDeviceFeature;
