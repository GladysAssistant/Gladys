import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

const NumberDeviceFeature = ({ children, ...props }) => {
  // Same granularity rule as the other editable rows: a feature declaring a step
  // finer than 1 can be typed at that precision, the rest stay whole numbers.
  const step = props.deviceFeature.step || 1;

  function updateValue(e) {
    props.updateValueWithDebounce(props.deviceFeature, e.target.value);
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

      <td class="py-0">
        <div class="d-flex justify-content-end">
          <input
            type="number"
            value={props.deviceFeature.last_value}
            class="form-control col-5 text-center px-1"
            onChange={updateValue}
            step={step}
            min={props.deviceFeature.min}
            max={props.deviceFeature.max}
          />
        </div>
      </td>
    </tr>
  );
};

export default NumberDeviceFeature;
