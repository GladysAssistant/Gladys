import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { AC_FAN_SPEED } from '../../../../../../server/utils/constants';
import AdaptiveOptionControl from './AdaptiveOptionControl';

const FAN_SPEED_OPTIONS = [
  { value: AC_FAN_SPEED.AUTO, i18nKey: 'auto' },
  { value: AC_FAN_SPEED.LOW, i18nKey: 'low' },
  { value: AC_FAN_SPEED.LOW_MID, i18nKey: 'low-mid' },
  { value: AC_FAN_SPEED.MID, i18nKey: 'mid' },
  { value: AC_FAN_SPEED.MID_HIGH, i18nKey: 'mid-high' },
  { value: AC_FAN_SPEED.HIGH, i18nKey: 'high' },
  { value: AC_FAN_SPEED.QUIET, i18nKey: 'quiet' },
  { value: AC_FAN_SPEED.TURBO, i18nKey: 'turbo' }
];

const AirConditioningFanSpeedDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  // Only offer the speeds this AC supports (its supported_options); a feature without restrictions
  // keeps the full list. The control shows buttons when they fit on one line, a dropdown otherwise.
  const options = resolveFeatureOptions(deviceFeature, FAN_SPEED_OPTIONS);
  const updateValue = value => props.updateValueWithDebounce(deviceFeature, value);

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'wind' })}`} />
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

export default AirConditioningFanSpeedDeviceFeature;
