import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

const NumberDeviceFeature = ({ children, ...props }) => {
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
            step={1}
            min={props.deviceFeature.min}
            max={props.deviceFeature.max}
          />
        </div>
      </td>
    </tr>
  );
};

export default NumberDeviceFeature;
