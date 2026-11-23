import get from 'get-value';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../server/utils/constants';
import { decimalsOf } from '../../../../../../server/utils/units';

import style from './style.css';

const isNullOrUndefined = val => val === null || val === undefined;

// adding a decimal step in binary floating point drifts (20.1 + 0.1 =
// 20.200000000000003), so the sum is rounded on the finest grid of its two
// operands: rounding on the step alone would snap a 20.5 set from the
// physical remote to 21 as soon as the step is a whole degree
const addToValue = (value, step) =>
  Number((value + step).toFixed(Math.min(100, Math.max(decimalsOf(value), decimalsOf(step)))));

const SETPOINT_STEP_BY_CATEGORY = {
  [DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]: 1,
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: 1,
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CHARGE]: 1,
  // A storage tank is set in whole degrees; the 0.5 default is room-thermostat granularity.
  [DEVICE_FEATURE_CATEGORIES.WATER_HEATER]: 1
};

const DEFAULT_VALUE_BY_CATEGORY = {
  [DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]: 18,
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: 18,
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CLIMATE]: 18,
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: 0,
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CHARGE]: 5,
  [DEVICE_FEATURE_CATEGORIES.WATER_HEATER]: 55
};

// The range the device accepts, from the min/max of the feature. A range with no width or an
// inverted one is ignored rather than pinning the control to a single value.
const getRange = deviceFeature => {
  if (isNullOrUndefined(deviceFeature.min) || isNullOrUndefined(deviceFeature.max)) {
    return null;
  }
  const min = Number(deviceFeature.min);
  const max = Number(deviceFeature.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    return null;
  }
  return { min, max };
};

const clampToRange = (value, range) => (range ? Math.min(range.max, Math.max(range.min, value)) : value);

const SetpointDeviceFeature = ({ children, ...props }) => {
  const SETPOINT_STEP = props.deviceFeature.step || SETPOINT_STEP_BY_CATEGORY[props.deviceFeature.category] || 0.5;
  const DEFAULT_VALUE_IN_CASE_EMPTY = DEFAULT_VALUE_BY_CATEGORY[props.deviceFeature.category] || 0;
  const range = getRange(props.deviceFeature);
  const currentValue = isNullOrUndefined(props.deviceFeature.last_value)
    ? DEFAULT_VALUE_IN_CASE_EMPTY
    : Number(props.deviceFeature.last_value);
  // + and − stop at the bounds of the device: a value the device would refuse is never sent.
  // A value left outside the range (by the device itself) steps into it, not further outside.
  const canAdd = !range || currentValue < range.max;
  const canSubstract = !range || currentValue > range.min;

  function updateValue(value) {
    props.updateValueWithDebounce(props.deviceFeature, value);
  }

  function updateValueEvent(e) {
    const typedValue = Number(e.target.value);
    if (e.target.value === '' || !Number.isFinite(typedValue)) {
      updateValue(e.target.value);
      return;
    }
    // a typed value outside the range is brought back to the nearest bound
    const value = clampToRange(typedValue, range);
    if (value !== typedValue) {
      e.target.value = value;
    }
    updateValue(value);
  }

  function add() {
    if (canAdd) {
      updateValue(clampToRange(addToValue(currentValue, SETPOINT_STEP), range));
    }
  }

  function substract() {
    if (canSubstract) {
      updateValue(clampToRange(addToValue(currentValue, -SETPOINT_STEP), range));
    }
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
      <td>{props.rowName}</td>

      {/* One horizontal − value + capsule at every width: in a card too narrow
          for it next to the name, the compact card mode of the device widget
          (routes/dashboard/style.css) drops it under the name instead — which
          replaced the stacked +/value/− variant this row used to carry for
          the 992-1300px viewports. */}
      <td class="py-0">
        <div class="d-flex justify-content-end">
          <div class={cx('input-group', style.setpointHorizontalControls)}>
            <div class="input-group-prepend">
              <button
                class="btn btn-outline-secondary"
                type="button"
                onClick={substract}
                disabled={!canSubstract}
                data-cy="setpoint-substract"
              >
                <Text id="dashboard.boxes.devicesInRoom.substractButton" />
              </button>
            </div>
            <input
              type="number"
              value={props.deviceFeature.last_value}
              class={cx('form-control text-center', style.removeNumberArrow, style.setpointValue)}
              onChange={updateValueEvent}
              data-cy="setpoint-value"
              step={SETPOINT_STEP}
              min={props.deviceFeature.min}
              max={props.deviceFeature.max}
            />
            <div class="input-group-append">
              <button
                class="btn btn-outline-secondary"
                type="button"
                onClick={add}
                disabled={!canAdd}
                data-cy="setpoint-add"
              >
                <Text id="dashboard.boxes.devicesInRoom.addButton" />
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default SetpointDeviceFeature;
