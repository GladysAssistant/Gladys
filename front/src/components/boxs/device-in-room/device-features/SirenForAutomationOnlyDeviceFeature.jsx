import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { SIREN_AUTOMATION_STATE } from '../../../../../../server/utils/constants';

const SirenForAutomationOnlyDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;

  function updateValue(e) {
    props.updateValueWithDebounce(deviceFeature, Number(e.currentTarget.value));
  }

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'sliders' })}`} />
      </td>
      <td>{props.rowName}</td>

      <td class="py-0">
        <div class="d-flex justify-content-end">
          <div class="form-group mb-0">
            <select value={deviceFeature.last_value} onChange={updateValue} class="form-control form-control-sm">
              <option value={SIREN_AUTOMATION_STATE.STOP}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.stop`} />
              </option>
              <option value={SIREN_AUTOMATION_STATE.SMOKE_SIREN}>
                <Text id={`deviceFeatureAction.category.${category}.${type}.smoke-siren`} />
              </option>
            </select>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default SirenForAutomationOnlyDeviceFeature;
