import { getDeviceName } from './utils';

import { DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

const BinaryDeviceType = ({ children, ...props }) => {
  function updateValue() {
    props.updateValue(
      props.x,
      props.y,
      props.device,
      props.deviceFeature,
      props.deviceIndex,
      props.deviceFeatureIndex,
      props.deviceFeature.last_value === 0 ? 1 : 0
    );
  }

  return (
    <tr>
      <td>
        <i class="fe fe-toggle-right" />
      </td>
      <td>{getDeviceName(props.device, props.deviceFeature)}</td>
      {props.deviceFeature.read_only === false && (
        <td class="text-right">
          <label class="custom-switch">
            <input
              type="radio"
              name={props.deviceFeature.id}
              value="1"
              class="custom-switch-input"
              checked={props.deviceFeature.last_value}
              onClick={updateValue}
            />
            <span class="custom-switch-indicator" />
          </label>
        </td>
      )}
        {props.deviceFeature.read_only === true && (
          <td class="text-right">
            {props.deviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY && (
              <div>
                {props.deviceFeature.last_value === 1 && <i class="fe fe-power" />}
                {props.deviceFeature.last_value === 0 && <i class="fe fe-zap-off" />}
              </div>
            )}
          </td>
        )}
    </tr>
  );
};

export default BinaryDeviceType;
