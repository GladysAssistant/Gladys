import get from 'get-value';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { getDeviceName } from './utils';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

import style from './style.css';

const isNullOrUndefined = val => val === null || val === undefined;
const DEFAULT_TEMPERATURE_IN_CASE_EMPTY = 18;

const ThermostatDeviceFeature = ({ children, ...props }) => {
  function updateValue(value) {
    props.updateValueWithDebounce(
      props.x,
      props.y,
      props.device,
      props.deviceFeature,
      props.deviceIndex,
      props.deviceFeatureIndex,
      value,
      props.deviceFeature.last_value
    );
  }

  function updateValueEvent(e) {
    updateValue(e.target.value);
  }

  function add() {
    const prevValue = isNullOrUndefined(props.deviceFeature.last_value)
      ? DEFAULT_TEMPERATURE_IN_CASE_EMPTY
      : props.deviceFeature.last_value;
    updateValue(prevValue + 0.5);
  }

  function substract() {
    const prevValue = isNullOrUndefined(props.deviceFeature.last_value)
      ? DEFAULT_TEMPERATURE_IN_CASE_EMPTY
      : props.deviceFeature.last_value;
    updateValue(prevValue - 0.5);
  }

  return (
    <tr>
      <td>
        <i
          class={`fe fe-${get(
            DeviceFeatureCategoriesIcon,
            `${props.deviceFeature.category}.${props.deviceFeature.type}`,
            { default: 'hash' }
          )}`}
        />
      </td>
      <td>{getDeviceName(props.device, props.deviceFeature)}</td>

      <td class="py-0">
        <div class="d-flex justify-content-end">
          <div class="d-flex">
            <div class="input-group">
              <div class="input-group-prepend">
                <button class="btn btn-outline-secondary" type="button" onClick={substract}>
                  <Text id="dashboard.boxes.devicesInRoom.substractButton" />
                </button>
              </div>
              <input
                type="number"
                value={props.deviceFeature.last_value}
                class={cx('form-control text-center', style.removeNumberArrow)}
                onChange={updateValueEvent}
                step={0.5}
                min={props.deviceFeature.min}
                max={props.deviceFeature.max}
              />
              {props.deviceFeature.unit && (
                <div class="input-group-append">
                  <button class="btn btn-outline-secondary" type="button" onClick={add}>
                    <Text id="dashboard.boxes.devicesInRoom.addButton" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default ThermostatDeviceFeature;
