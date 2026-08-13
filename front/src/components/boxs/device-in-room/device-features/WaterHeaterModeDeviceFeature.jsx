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
  { value: WATER_HEATER_MODE.AWAY, i18nKey: 'away' },
  { value: WATER_HEATER_MODE.PROGRAM, i18nKey: 'program' },
];

const WaterHeaterModeDeviceFeature = (props) => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  // No two water heaters offer the same mode list, so the feature's supported_options drive which
  // entries appear and in what order. Features published without them (legacy, or an integration
  // that cannot enumerate its modes) fall back to the whole catalog: unlike a fan speed, these
  // values are a set and not a ladder — AWAY is not "more" than MANUAL — so the feature's `max`
  // carries no information about which modes exist, and filtering on it would hide valid modes, or
  // every mode at all when `max` is unset (a feature created by hand has no min/max).
  const options = resolveFeatureOptions(deviceFeature, MODE_OPTIONS);
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

export default WaterHeaterModeDeviceFeature;
