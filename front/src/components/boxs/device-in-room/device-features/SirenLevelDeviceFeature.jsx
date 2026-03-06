import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { SIREN_LMH_VOLUME } from '../../../../../../server/utils/constants';

const SirenLevelDeviceFeature = ({ children, ...props }) => {
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
              <option value={SIREN_LMH_VOLUME.LOW}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.low`} />
              </option>
              <option value={SIREN_LMH_VOLUME.MEDIUM}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.medium`} />
              </option>
              <option value={SIREN_LMH_VOLUME.HIGH}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.high`} />
              </option>
              <option value={SIREN_LMH_VOLUME.VERY_HIGH}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.very_high`} />
              </option>
            </select>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default SirenLevelDeviceFeature;
