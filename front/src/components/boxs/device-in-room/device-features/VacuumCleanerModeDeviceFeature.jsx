import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { VACUUM_CLEANER_MODE } from '../../../../../../server/utils/constants';

const VacuumCleanerModeDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;

  function updateValue(e) {
    props.updateValueWithDebounce(deviceFeature, e.currentTarget.value);
  }

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'settings' })}`} />
      </td>
      <td>{props.rowName}</td>

      <td class="py-0">
        <div class="justify-content-end">
          <div class="form-group mb-0">
            <select value={props.deviceFeature.last_value} onChange={updateValue} class="form-control form-control-sm">
              <option value={VACUUM_CLEANER_MODE.IDLE}>
                <Text id={`deviceFeatureAction.category.vacuum-cleaner.mode.idle`} />
              </option>
              <option value={VACUUM_CLEANER_MODE.CLEANING}>
                <Text id={`deviceFeatureAction.category.vacuum-cleaner.mode.cleaning`} />
              </option>
              <option value={VACUUM_CLEANER_MODE.MAPPING}>
                <Text id={`deviceFeatureAction.category.vacuum-cleaner.mode.mapping`} />
              </option>
            </select>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default VacuumCleanerModeDeviceFeature;
