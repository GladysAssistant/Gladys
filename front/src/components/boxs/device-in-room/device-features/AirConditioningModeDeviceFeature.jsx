import get from 'get-value';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { AC_MODE } from '../../../../../../server/utils/constants';
import style from './style.css';

const MODE_OPTIONS = [
  { value: AC_MODE.AUTO, i18nKey: 'auto', tuyaValues: ['auto'] },
  { value: AC_MODE.COOLING, i18nKey: 'cooling', tuyaValues: ['cold', 'cool'] },
  { value: AC_MODE.HEATING, i18nKey: 'heating', tuyaValues: ['heat', 'hot'] },
  { value: AC_MODE.DRYING, i18nKey: 'drying', tuyaValues: ['wet', 'dry'] },
  { value: AC_MODE.FAN, i18nKey: 'fan', tuyaValues: ['fan', 'wind'] }
];

const AirConditioningModeDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const lastValue =
    deviceFeature.last_value !== null && deviceFeature.last_value !== undefined
      ? Number.isNaN(Number(deviceFeature.last_value))
        ? deviceFeature.last_value
        : Number(deviceFeature.last_value)
      : deviceFeature.last_value;

  function updateValue(value) {
    props.updateValueWithDebounce(deviceFeature, value);
  }

  const supportedTuyaValues = Array.isArray(deviceFeature.enum)
    ? deviceFeature.enum.map(value => String(value).toLowerCase())
    : null;

  const options = supportedTuyaValues
    ? MODE_OPTIONS.filter(option => option.tuyaValues.some(value => supportedTuyaValues.includes(value)))
    : MODE_OPTIONS;

  const effectiveOptions = options.length > 0 ? options : MODE_OPTIONS;

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'sliders' })}`} />
      </td>
      <td>{props.rowName}</td>

      <td class="py-0">
        <div class="d-flex justify-content-end">
          <div class={cx(style.acModeGroup)} role="group">
            {effectiveOptions.map(option => (
              <button
                class={cx('btn btn-sm btn-secondary', style.acModeButton, {
                  active: lastValue === option.value
                })}
                onClick={() => updateValue(option.value)}
                key={option.value}
              >
                <Text id={`deviceFeatureAction.category.${category}.${type}.${option.i18nKey}`} />
              </button>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default AirConditioningModeDeviceFeature;
