import get from 'get-value';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { AC_MODE } from '../../../../../../server/utils/constants';

const AC_MODE_TRANSLATION_KEYS = {
  [AC_MODE.AUTO]: 'auto',
  [AC_MODE.COOLING]: 'cooling',
  [AC_MODE.HEATING]: 'heating',
  [AC_MODE.DRYING]: 'drying',
  [AC_MODE.FAN]: 'fan'
};

const AirConditioningModeDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type, last_value: lastValue, supported_options: supportedOptions } = deviceFeature;

  let modes;
  if (supportedOptions && supportedOptions.length > 0) {
    modes = [...supportedOptions].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  } else {
    // Legacy features without supported_options: auto/cool/heat, plus
    // dry/fan when the feature range covers them
    modes = [AC_MODE.AUTO, AC_MODE.COOLING, AC_MODE.HEATING, AC_MODE.DRYING, AC_MODE.FAN]
      .filter(mode => mode <= AC_MODE.HEATING || mode <= deviceFeature.max)
      .map(mode => ({ value: mode }));
  }

  function updateValue(value) {
    props.updateValueWithDebounce(deviceFeature, value);
  }

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'sliders' })}`} />
      </td>
      <td>{props.rowName}</td>

      <td class="py-0">
        <div class="d-flex justify-content-end">
          <div class="btn-group" role="group">
            {modes.map(mode => (
              <button
                key={mode.value}
                class={cx('btn btn-sm btn-secondary', {
                  active: lastValue === mode.value
                })}
                onClick={() => updateValue(mode.value)}
              >
                <Text
                  id={`deviceFeatureAction.category.${category}.${type}.${AC_MODE_TRANSLATION_KEYS[mode.value]}`}
                  default={mode.label || String(mode.value)}
                />
              </button>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default AirConditioningModeDeviceFeature;
