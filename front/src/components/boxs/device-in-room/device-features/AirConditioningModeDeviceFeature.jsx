import get from 'get-value';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { AC_MODE } from '../../../../../../server/utils/constants';

const AirConditioningModeDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type, last_value: lastValue } = deviceFeature;

  // Only display extra modes when the feature range covers them,
  // so integrations exposing only auto/cool/heat keep a 3-button widget
  const showDrying = deviceFeature.max >= AC_MODE.DRYING;
  const showFan = deviceFeature.max >= AC_MODE.FAN;

  function updateValue(value) {
    props.updateValueWithDebounce(deviceFeature, value);
  }

  function auto() {
    updateValue(AC_MODE.AUTO);
  }

  function cooling() {
    updateValue(AC_MODE.COOLING);
  }

  function heating() {
    updateValue(AC_MODE.HEATING);
  }

  function drying() {
    updateValue(AC_MODE.DRYING);
  }

  function fan() {
    updateValue(AC_MODE.FAN);
  }

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'sliders' })}`} />
      </td>
      <td>{props.rowName}</td>

      <td class="py-0">
        <div class="d-flex justify-content-end">
          <div class="btn-group" role="group">
            <button
              class={cx('btn btn-sm btn-secondary', {
                active: lastValue === AC_MODE.AUTO
              })}
              onClick={auto}
            >
              <Text id={`deviceFeatureAction.category.${category}.${type}.auto`} plural={AC_MODE.HEATING} />
            </button>
            <button
              class={cx('btn btn-sm btn-secondary', {
                active: lastValue === AC_MODE.COOLING
              })}
              onClick={cooling}
            >
              <Text id={`deviceFeatureAction.category.${category}.${type}.cooling`} plural={AC_MODE.HEATING} />
            </button>
            <button
              class={cx('btn btn-sm', 'btn-secondary', {
                active: lastValue === AC_MODE.HEATING
              })}
              onClick={heating}
            >
              <Text id={`deviceFeatureAction.category.${category}.${type}.heating`} plural={AC_MODE.HEATING} />
            </button>
            {showDrying && (
              <button
                class={cx('btn btn-sm', 'btn-secondary', {
                  active: lastValue === AC_MODE.DRYING
                })}
                onClick={drying}
              >
                <Text id={`deviceFeatureAction.category.${category}.${type}.drying`} plural={AC_MODE.HEATING} />
              </button>
            )}
            {showFan && (
              <button
                class={cx('btn btn-sm', 'btn-secondary', {
                  active: lastValue === AC_MODE.FAN
                })}
                onClick={fan}
              >
                <Text id={`deviceFeatureAction.category.${category}.${type}.fan`} plural={AC_MODE.HEATING} />
              </button>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default AirConditioningModeDeviceFeature;
