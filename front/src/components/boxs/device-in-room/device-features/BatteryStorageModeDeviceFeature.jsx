import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { BATTERY_STORAGE_MODE } from '../../../../../../server/utils/constants';
import AdaptiveOptionControl from './AdaptiveOptionControl';

const MODE_OPTIONS = [
  { value: BATTERY_STORAGE_MODE.AUTO, i18nKey: 'auto' },
  { value: BATTERY_STORAGE_MODE.CHARGE, i18nKey: 'charge' },
  { value: BATTERY_STORAGE_MODE.DISCHARGE, i18nKey: 'discharge' },
  { value: BATTERY_STORAGE_MODE.STANDBY, i18nKey: 'standby' }
];

const BatteryStorageModeDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  // Batteries do not all offer the same modes (many have no standby, some cannot be forced to
  // discharge), so the feature's supported_options drive which entries appear and in what order.
  // Features published without them fall back to the whole catalog: the modes are a set and not a
  // ladder — STANDBY is not "more" than CHARGE — so the feature's `max` says nothing about which
  // modes exist, and filtering on it would hide valid modes, or every mode when `max` is unset.
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

export default BatteryStorageModeDeviceFeature;
