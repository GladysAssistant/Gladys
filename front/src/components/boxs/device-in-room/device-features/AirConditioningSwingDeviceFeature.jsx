import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { AC_SWING_HORIZONTAL, AC_SWING_VERTICAL, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

const SWING_HORIZONTAL_OPTIONS = [
  { value: AC_SWING_HORIZONTAL.OFF, i18nKey: 'off' },
  { value: AC_SWING_HORIZONTAL.SAME, i18nKey: 'same' },
  { value: AC_SWING_HORIZONTAL.OPPOSITE, i18nKey: 'opposite' }
];

const SWING_VERTICAL_OPTIONS = [
  { value: AC_SWING_VERTICAL.OFF, i18nKey: 'off' },
  { value: AC_SWING_VERTICAL.SWING, i18nKey: 'swing' },
  { value: AC_SWING_VERTICAL.POSITION_1, i18nKey: 'position-1' },
  { value: AC_SWING_VERTICAL.POSITION_2, i18nKey: 'position-2' },
  { value: AC_SWING_VERTICAL.POSITION_3, i18nKey: 'position-3' },
  { value: AC_SWING_VERTICAL.POSITION_4, i18nKey: 'position-4' },
  { value: AC_SWING_VERTICAL.POSITION_5, i18nKey: 'position-5' }
];

const AirConditioningSwingDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;
  const options =
    type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_HORIZONTAL ? SWING_HORIZONTAL_OPTIONS : SWING_VERTICAL_OPTIONS;

  const updateValue = e => {
    props.updateValueWithDebounce(deviceFeature, Number(e.currentTarget.value));
  };

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'refresh-cw' })}`} />
      </td>
      <td>{props.rowName}</td>

      <td class="py-0">
        <div class="justify-content-end">
          <div class="form-group mb-0">
            <select value={lastValue} onChange={updateValue} class="form-control form-control-sm">
              {options.map(option => (
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

export default AirConditioningSwingDeviceFeature;
