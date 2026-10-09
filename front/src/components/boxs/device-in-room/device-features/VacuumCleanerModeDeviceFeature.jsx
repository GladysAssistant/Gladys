import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { VACUUM_CLEANER_MODE } from '../../../../../../server/utils/constants';

const MODE_OPTIONS = [
  { value: VACUUM_CLEANER_MODE.IDLE, i18nKey: 'idle' },
  { value: VACUUM_CLEANER_MODE.CLEANING, i18nKey: 'cleaning' },
  { value: VACUUM_CLEANER_MODE.MAPPING, i18nKey: 'mapping' }
];

const VacuumCleanerModeDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;

  // Not every robot can run a mapping pass: the feature's supported_options drive which entries
  // appear and in what order. Features without them keep the whole catalog.
  const options = resolveFeatureOptions(deviceFeature, MODE_OPTIONS);

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
                      id={`deviceFeatureAction.category.vacuum-cleaner.mode.${option.i18nKey}`}
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

export default VacuumCleanerModeDeviceFeature;
