import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { THERMOSTAT_PRESET } from '../../../../../../server/utils/constants';
import AdaptiveOptionControl from './AdaptiveOptionControl';

const PRESET_OPTIONS = [
  { value: THERMOSTAT_PRESET.SCHEDULE, i18nKey: 'schedule' },
  { value: THERMOSTAT_PRESET.FROST, i18nKey: 'frost' },
  { value: THERMOSTAT_PRESET.AWAY, i18nKey: 'away' },
  { value: THERMOSTAT_PRESET.ECO, i18nKey: 'eco' },
  { value: THERMOSTAT_PRESET.NIGHT, i18nKey: 'night' },
  { value: THERMOSTAT_PRESET.COMFORT, i18nKey: 'comfort' }
];

const ThermostatPresetDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  // Only offer the presets this thermostat supports. A device that carries a weekly
  // programme declares the full set through supported_options; one that has presets but
  // no programme of its own leaves SCHEDULE out of them. With no supported_options at
  // all, every preset is offered: unlike the modes, presets are a Gladys notion, so
  // there is no feature range to narrow them by.
  const hasSupportedOptions =
    Array.isArray(deviceFeature.supported_options) && deviceFeature.supported_options.length > 0;
  const options = hasSupportedOptions ? resolveFeatureOptions(deviceFeature, PRESET_OPTIONS) : PRESET_OPTIONS;
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

export default ThermostatPresetDeviceFeature;
