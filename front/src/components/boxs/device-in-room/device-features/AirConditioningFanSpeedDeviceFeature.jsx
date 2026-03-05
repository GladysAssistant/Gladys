import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { AC_FAN_SPEED } from '../../../../../../server/utils/constants';

const FAN_SPEED_OPTIONS = [
  { value: AC_FAN_SPEED.AUTO, i18nKey: 'auto' },
  { value: AC_FAN_SPEED.LOW, i18nKey: 'low' },
  { value: AC_FAN_SPEED.LOW_MID, i18nKey: 'low-mid' },
  { value: AC_FAN_SPEED.MID, i18nKey: 'mid' },
  { value: AC_FAN_SPEED.MID_HIGH, i18nKey: 'mid-high' },
  { value: AC_FAN_SPEED.HIGH, i18nKey: 'high' },
  { value: AC_FAN_SPEED.MUTE, i18nKey: 'mute' },
  { value: AC_FAN_SPEED.TURBO, i18nKey: 'turbo' }
];

const AirConditioningFanSpeedDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  const updateValue = e => {
    props.updateValueWithDebounce(deviceFeature, Number(e.currentTarget.value));
  };

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
              {FAN_SPEED_OPTIONS.map(option => (
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
