import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { VACUUM_CLEANER_CLEAN_MODE } from '../../../../../../server/utils/constants';

const VacuumCleanerCleanModeDeviceFeature = ({ children, ...props }) => {
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
              <option value={VACUUM_CLEANER_CLEAN_MODE.AUTO}>
                <Text id={`deviceFeatureAction.category.vacuum-cleaner.clean-mode.auto`} />
              </option>
              <option value={VACUUM_CLEANER_CLEAN_MODE.QUICK}>
                <Text id={`deviceFeatureAction.category.vacuum-cleaner.clean-mode.quick`} />
              </option>
              <option value={VACUUM_CLEANER_CLEAN_MODE.QUIET}>
                <Text id={`deviceFeatureAction.category.vacuum-cleaner.clean-mode.quiet`} />
              </option>
              <option value={VACUUM_CLEANER_CLEAN_MODE.LOW_NOISE}>
                <Text id={`deviceFeatureAction.category.vacuum-cleaner.clean-mode.low-noise`} />
              </option>
              <option value={VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN}>
                <Text id={`deviceFeatureAction.category.vacuum-cleaner.clean-mode.deep-clean`} />
              </option>
              <option value={VACUUM_CLEANER_CLEAN_MODE.VACUUM}>
                <Text id={`deviceFeatureAction.category.vacuum-cleaner.clean-mode.vacuum`} />
              </option>
              <option value={VACUUM_CLEANER_CLEAN_MODE.MOP}>
                <Text id={`deviceFeatureAction.category.vacuum-cleaner.clean-mode.mop`} />
              </option>
            </select>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default VacuumCleanerCleanModeDeviceFeature;
