import get from 'get-value';

import { getDeviceName } from './utils';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

const MultiLevelDeviceType = ({ children, ...props }) => {
  function updateValue(e) {
    props.updateValueWithDebounce(
      props.x,
      props.y,
      props.device,
      props.deviceFeature,
      props.deviceIndex,
      props.deviceFeatureIndex,
      e.target.value,
      props.deviceFeature.last_value
    );
  }

  return (
    <tr>
      <td>
        <i
          class={`fe fe-${get(
            DeviceFeatureCategoriesIcon,
            `${props.deviceFeature.category}.${props.deviceFeature.type}`,
            { default: 'arrow-right' }
          )}`}
        />
      </td>
      <td>{getDeviceName(props.device, props.deviceFeature)}</td>

      <td class="text-right" style="padding-top: 0px; padding-bottom: 0px">
        <div class="col">
          <input
            style={{
              minHeight: '30px'
            }}
            type="range"
            value={props.deviceFeature.last_value}
            onChange={updateValue}
            class="custom-range"
            step="1"
            min={props.deviceFeature.min}
            max={props.deviceFeature.max}
          />
        </div>
      </td>
    </tr>
  );
};

export default MultiLevelDeviceType;
