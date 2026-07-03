import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { getSupportedOptionValues } from '../../../../utils/supportedOptions';
import { PILOT_WIRE_MODE } from '../../../../../../server/utils/constants';

// The mode values come from the shared PILOT_WIRE_MODE constant; this table only binds each value
// to its i18n slug in the standard `deviceFeatureAction` dictionary of the dashboard widgets.
const PILOT_WIRE_MODE_OPTIONS = [
  { value: PILOT_WIRE_MODE.OFF, textKey: 'off' },
  { value: PILOT_WIRE_MODE.FROST_PROTECTION, textKey: 'frost-protection' },
  { value: PILOT_WIRE_MODE.ECO, textKey: 'eco' },
  { value: PILOT_WIRE_MODE.COMFORT_2, textKey: 'comfort_-2' },
  { value: PILOT_WIRE_MODE.COMFORT_1, textKey: 'comfort_-1' },
  { value: PILOT_WIRE_MODE.COMFORT, textKey: 'comfort' },
  { value: PILOT_WIRE_MODE.PROGRAMMING, textKey: 'programming' },
  { value: PILOT_WIRE_MODE.THERMOSTAT, textKey: 'thermostat' }
];

const PilotWireModeDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;

  function updateValue(e) {
    props.updateValueWithDebounce(deviceFeature, e.currentTarget.value);
  }

  // Only offer the modes this feature supports (its supported_options); a feature without
  // restrictions keeps the full list.
  const supportedValues = getSupportedOptionValues(deviceFeature);
  const modeOptions = PILOT_WIRE_MODE_OPTIONS.filter(
    mode => supportedValues === null || supportedValues.includes(mode.value)
  );

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'sliders' })}`} />
      </td>
      <td>{props.rowName}</td>

      <td class="py-0">
        <div class="justify-content-end">
          <div class="form-group mb-0">
            <select value={props.deviceFeature.last_value} onChange={updateValue} class="form-control form-control-sm">
              {modeOptions.map(mode => (
                <option value={mode.value}>
                  <Text id={`deviceFeatureAction.category.${category}.${type}.${mode.textKey}`} />
                </option>
              ))}
            </select>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default PilotWireModeDeviceFeature;
