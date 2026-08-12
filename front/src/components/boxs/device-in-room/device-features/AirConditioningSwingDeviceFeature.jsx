import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { AC_SWING_HORIZONTAL, AC_SWING_VERTICAL, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import AdaptiveOptionControl from './AdaptiveOptionControl';

const SWING_HORIZONTAL_OPTIONS = [
  { value: AC_SWING_HORIZONTAL.OFF, i18nKey: 'off' },
  { value: AC_SWING_HORIZONTAL.SWING, i18nKey: 'swing' },
  { value: AC_SWING_HORIZONTAL.POSITION_1, i18nKey: 'position-1' },
  { value: AC_SWING_HORIZONTAL.POSITION_2, i18nKey: 'position-2' },
  { value: AC_SWING_HORIZONTAL.POSITION_3, i18nKey: 'position-3' },
  { value: AC_SWING_HORIZONTAL.POSITION_4, i18nKey: 'position-4' },
  { value: AC_SWING_HORIZONTAL.POSITION_5, i18nKey: 'position-5' },
  { value: AC_SWING_HORIZONTAL.SWING_OPPOSITE, i18nKey: 'swing-opposite' }
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

  // Only offer the swing positions this AC supports (its supported_options); a feature without
  // restrictions keeps the full list. Buttons when they fit on one line, a dropdown otherwise.
  const staticOptions =
    type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_HORIZONTAL ? SWING_HORIZONTAL_OPTIONS : SWING_VERTICAL_OPTIONS;
  const options = resolveFeatureOptions(deviceFeature, staticOptions);
  const updateValue = value => props.updateValueWithDebounce(deviceFeature, value);

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'refresh-cw' })}`} />
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

export default AirConditioningSwingDeviceFeature;
