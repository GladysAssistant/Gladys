import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { PILOT_WIRE_MODE } from '../../../../../../server/utils/constants';

const PilotWireModeDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;

  function updateValue(e) {
    props.updateValueWithDebounce(deviceFeature, e.currentTarget.value);
  }

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
              <option value={PILOT_WIRE_MODE.OFF}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.off`} />
              </option>
              <option value={PILOT_WIRE_MODE.FROST_PROTECTION}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.frost-protection`} />
              </option>
              <option value={PILOT_WIRE_MODE.ECO}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.eco`} />
              </option>
              <option value={PILOT_WIRE_MODE.COMFORT_2}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.comfort_-2`} />
              </option>
              <option value={PILOT_WIRE_MODE.COMFORT_1}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.comfort_-1`} />
              </option>
              <option value={PILOT_WIRE_MODE.COMFORT}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.comfort`} />
              </option>
            </select>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default PilotWireModeDeviceFeature;
