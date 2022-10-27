import get from 'get-value';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { getDeviceName } from '../../../../utils/device';
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
            <div class={cx('input-group', style.thermostatHorizontalControls)}>
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
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" type="button" onClick={add}>
                  <Text id="dashboard.boxes.devicesInRoom.addButton" />
                </button>
              </div>
            </div>
            <div class={cx('input-group input-group-sm', style.thermostatVerticalControls)}>
              <div class="d-flex flex-column mt-2 mb-2">
                <div class="mb-1">
                  <button class="btn btn-block btn-sm btn-outline-secondary" type="button" onClick={add}>
                    <Text id="dashboard.boxes.devicesInRoom.addButton" />
                  </button>
                </div>
                <div>
                  <input
                    type="number"
                    value={props.deviceFeature.last_value}
                    class={cx('form-control text-center input-sm', style.removeNumberArrow)}
                    onChange={updateValueEvent}
                    step={0.5}
                    min={props.deviceFeature.min}
                    max={props.deviceFeature.max}
                  />
                </div>
                <div class="mt-1">
                  <button class="btn btn-block btn-sm btn-outline-secondary" type="button" onClick={substract}>
                    <Text id="dashboard.boxes.devicesInRoom.substractButton" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default ThermostatDeviceFeature;
