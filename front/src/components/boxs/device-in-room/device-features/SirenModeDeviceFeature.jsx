import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { SIREN_MODE } from '../../../../../../server/utils/constants';

const SirenModeDeviceFeature = ({ children, ...props }) => {
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
              <option value={SIREN_MODE.STOP}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.stop`} />
              </option>
              <option value={SIREN_MODE.BURGLAR}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.burglar`} />
              </option>
              <option value={SIREN_MODE.FIRE}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.fire`} />
              </option>
              <option value={SIREN_MODE.EMERGENCY}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.emergency`} />
              </option>
              <option value={SIREN_MODE.POLICE_PANIC}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.police_panic`} />
              </option>
              <option value={SIREN_MODE.FIRE_PANIC}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.fire_panic`} />
              </option>
              <option value={SIREN_MODE.EMERGENCY_PANIC}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.emergency_panic`} />
              </option>
            </select>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default SirenModeDeviceFeature;
