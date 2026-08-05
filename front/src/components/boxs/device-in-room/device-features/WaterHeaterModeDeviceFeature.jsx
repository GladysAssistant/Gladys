import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { WATER_HEATER_MODE } from '../../../../../../server/utils/constants';
import AdaptiveOptionControl from './AdaptiveOptionControl';

const MODE_OPTIONS = [
  { value: WATER_HEATER_MODE.OFF, i18nKey: 'off' },
  { value: WATER_HEATER_MODE.AUTO, i18nKey: 'auto' },
  { value: WATER_HEATER_MODE.ECO, i18nKey: 'eco' },
  { value: WATER_HEATER_MODE.BOOST, i18nKey: 'boost' },
  { value: WATER_HEATER_MODE.MANUAL, i18nKey: 'manual' },
  { value: WATER_HEATER_MODE.ABSENCE, i18nKey: 'absence' },
  { value: WATER_HEATER_MODE.PROGRAM, i18nKey: 'program' }
];

const WaterHeaterModeDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  // No two water heaters offer the same mode list, so the feature's supported_options drive which
  // entries appear and in what order. Features published without them (legacy, or an integration
  // that cannot enumerate its modes) fall back to the full catalog bounded by the feature range.
  const hasSupportedOptions =
    Array.isArray(deviceFeature.supported_options) && deviceFeature.supported_options.length > 0;
  const options = hasSupportedOptions
    ? resolveFeatureOptions(deviceFeature, MODE_OPTIONS)
    : MODE_OPTIONS.filter(option => option.value <= deviceFeature.max).map(option => ({
        value: option.value,
        i18nKey: option.i18nKey
      }));
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

export default WaterHeaterModeDeviceFeature;
