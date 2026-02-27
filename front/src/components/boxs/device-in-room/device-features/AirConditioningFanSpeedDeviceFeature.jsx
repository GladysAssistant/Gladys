import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { AC_FAN_SPEED } from '../../../../../../server/utils/constants';

const FAN_SPEED_OPTIONS = [
  { value: AC_FAN_SPEED.AUTO, i18nKey: 'auto', tuyaValues: ['auto'] },
  { value: AC_FAN_SPEED.LOW, i18nKey: 'low', tuyaValues: ['low'] },
  { value: AC_FAN_SPEED.LOW_MID, i18nKey: 'low-mid', tuyaValues: ['low_mid', 'level_2'] },
  { value: AC_FAN_SPEED.MID, i18nKey: 'mid', tuyaValues: ['mid', 'middle'] },
  { value: AC_FAN_SPEED.MID_HIGH, i18nKey: 'mid-high', tuyaValues: ['mid_high', 'level_4'] },
  { value: AC_FAN_SPEED.HIGH, i18nKey: 'high', tuyaValues: ['high'] },
  { value: AC_FAN_SPEED.MUTE, i18nKey: 'mute', tuyaValues: ['mute'] },
  { value: AC_FAN_SPEED.TURBO, i18nKey: 'turbo', tuyaValues: ['turbo', 'strong'] }
];

const AirConditioningFanSpeedDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;

  const supportedTuyaValues = Array.isArray(deviceFeature.enum)
    ? deviceFeature.enum.map(value => String(value).toLowerCase())
    : null;

  const options = supportedTuyaValues
    ? FAN_SPEED_OPTIONS.filter(option => option.tuyaValues.some(value => supportedTuyaValues.includes(value)))
    : FAN_SPEED_OPTIONS;

  const effectiveOptions = options.length > 0 ? options : FAN_SPEED_OPTIONS;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  function updateValue(e) {
    const rawValue = e.currentTarget.value;
    const numericValue = Number(rawValue);
    props.updateValueWithDebounce(deviceFeature, Number.isNaN(numericValue) ? rawValue : numericValue);
  }

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'wind' })}`} />
      </td>
      <td>{props.rowName}</td>

      <td class="py-0">
        <div class="justify-content-end">
          <div class="form-group mb-0">
            <select value={lastValue} onChange={updateValue} class="form-control form-control-sm">
              {effectiveOptions.map(option => (
                <option value={option.value} key={option.value}>
                  <Text id={`deviceFeatureAction.category.${category}.${type}.${option.i18nKey}`} />
                </option>
              ))}
            </select>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default AirConditioningFanSpeedDeviceFeature;
