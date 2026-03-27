import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { AC_MODE } from '../../../../../../server/utils/constants';

const MODE_OPTIONS = [
  { value: AC_MODE.AUTO, i18nKey: 'auto' },
  { value: AC_MODE.COOLING, i18nKey: 'cooling' },
  { value: AC_MODE.HEATING, i18nKey: 'heating' },
  { value: AC_MODE.DRYING, i18nKey: 'drying' },
  { value: AC_MODE.FAN, i18nKey: 'fan' }
];

const AirConditioningModeDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  const updateValue = e => {
    props.updateValueWithDebounce(deviceFeature, Number(e.currentTarget.value));
  };

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'sliders' })}`} />
      </td>
      <td>{props.rowName}</td>

      <td class="py-0">
        <div class="justify-content-end">
          <div class="form-group mb-0">
            <select value={lastValue} onChange={updateValue} class="form-control form-control-sm">
              {MODE_OPTIONS.map(option => (
                <option value={option.value} key={option.value}>
                  <Text id={`deviceFeatureAction.category.${category}.${type}.${option.i18nKey}`} />
                </option>
              ))}
            </select>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default AirConditioningModeDeviceFeature;
