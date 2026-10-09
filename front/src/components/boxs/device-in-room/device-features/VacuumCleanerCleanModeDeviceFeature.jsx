import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { VACUUM_CLEANER_CLEAN_MODE } from '../../../../../../server/utils/constants';

const CLEAN_MODE_OPTIONS = [
  { value: VACUUM_CLEANER_CLEAN_MODE.AUTO, i18nKey: 'auto' },
  { value: VACUUM_CLEANER_CLEAN_MODE.QUICK, i18nKey: 'quick' },
  { value: VACUUM_CLEANER_CLEAN_MODE.QUIET, i18nKey: 'quiet' },
  { value: VACUUM_CLEANER_CLEAN_MODE.LOW_NOISE, i18nKey: 'low-noise' },
  { value: VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN, i18nKey: 'deep-clean' },
  { value: VACUUM_CLEANER_CLEAN_MODE.VACUUM, i18nKey: 'vacuum' },
  { value: VACUUM_CLEANER_CLEAN_MODE.MOP, i18nKey: 'mop' }
];

const VacuumCleanerCleanModeDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;

  // Robots rarely support every clean mode: the feature's supported_options drive which entries
  // appear and in what order. Features without them keep the whole catalog.
  const options = resolveFeatureOptions(deviceFeature, CLEAN_MODE_OPTIONS);

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
              {options.map(option => (
                <option value={option.value} key={option.value}>
                  {option.i18nKey ? (
                    <Text
                      id={`deviceFeatureAction.category.vacuum-cleaner.clean-mode.${option.i18nKey}`}
                      default={option.label || String(option.value)}
                    />
                  ) : (
                    option.label || String(option.value)
                  )}
                </option>
              ))}
            </select>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default VacuumCleanerCleanModeDeviceFeature;
