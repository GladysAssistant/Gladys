import get from 'get-value';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { THERMOSTAT_MODE } from '../../../../../../server/utils/constants';

const THERMOSTAT_MODE_TRANSLATION_KEYS = {
  [THERMOSTAT_MODE.OFF]: 'off',
  [THERMOSTAT_MODE.HEATING]: 'heating',
  [THERMOSTAT_MODE.COOLING]: 'cooling',
  [THERMOSTAT_MODE.AUTO]: 'auto',
  [THERMOSTAT_MODE.ENERGY_HEAT]: 'energy_heat'
};

const ThermostatModeDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type, last_value: lastValue, supported_options: supportedOptions } = deviceFeature;

  let modes;
  if (supportedOptions && supportedOptions.length > 0) {
    modes = [...supportedOptions].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  } else {
    // Legacy features without supported_options: off/heat/cool, plus
    // auto/energy heat when the feature range covers them
    modes = [
      THERMOSTAT_MODE.OFF,
      THERMOSTAT_MODE.HEATING,
      THERMOSTAT_MODE.COOLING,
      THERMOSTAT_MODE.AUTO,
      THERMOSTAT_MODE.ENERGY_HEAT
    ]
      .filter(mode => mode <= THERMOSTAT_MODE.COOLING || mode <= deviceFeature.max)
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
                  id={`deviceFeatureAction.category.${category}.${type}.${
                    THERMOSTAT_MODE_TRANSLATION_KEYS[mode.value]
                  }`}
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

export default ThermostatModeDeviceFeature;
