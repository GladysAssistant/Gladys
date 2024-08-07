import get from 'get-value';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { PILOT_WIRE_MODE } from '../../../../../../server/utils/constants';

const PilotWireModeDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type, last_value: lastValue } = deviceFeature;

  function updateValue(value) {
    props.updateValueWithDebounce(deviceFeature, value);
  }

  function comfort() {
    updateValue(PILOT_WIRE_MODE.COMFORT);
  }

  function eco() {
    updateValue(PILOT_WIRE_MODE.ECO);
  }

  function frost_protection() {
    updateValue(PILOT_WIRE_MODE.FROST_PROTECTION);
  }

  function off() {
    updateValue(PILOT_WIRE_MODE.OFF);
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
                active: lastValue === PILOT_WIRE_MODE.COMFORT
              })}
              onClick={comfort}
            >
              <Text id={`deviceFeatureAction.category.${category}.${type}.comfort`} plural={PILOT_WIRE_MODE.COMFORT} />
            </button>
            <button
              class={cx('btn btn-sm btn-secondary', {
                active: lastValue === PILOT_WIRE_MODE.ECO
              })}
              onClick={eco}
            >
              <Text id={`deviceFeatureAction.category.${category}.${type}.eco`} plural={PILOT_WIRE_MODE.ECO} />
            </button>
            <button
              class={cx('btn btn-sm btn-secondary', {
                active: lastValue === PILOT_WIRE_MODE.FROST_PROTECTION
              })}
              onClick={frost_protection}
            >
              <Text
                id={`deviceFeatureAction.category.${category}.${type}.frost_protection`}
                plural={PILOT_WIRE_MODE.FROST_PROTECTION}
              />
            </button>
            <button
              class={cx('btn btn-sm', 'btn-secondary', {
                active: lastValue === PILOT_WIRE_MODE.OFF
              })}
              onClick={off}
            >
              <Text id={`deviceFeatureAction.category.${category}.${type}.off`} plural={PILOT_WIRE_MODE.OFF} />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default PilotWireModeDeviceFeature;
