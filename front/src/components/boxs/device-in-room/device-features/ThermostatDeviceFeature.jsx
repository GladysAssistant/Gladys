import get from 'get-value';
import { Text } from 'preact-i18n';

import { getDeviceName } from './utils';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

const NumberDeviceFeature = ({ children, ...props }) => {
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
            { default: 'hash' }
          )}`}
        />
      </td>
      <td>{getDeviceName(props.device, props.deviceFeature)}</td>

      <td class="py-0">
        <div class="d-flex justify-content-end">
          <div class="d-flex">
            <div class="input-group">
              <input
                type="number"
                value={props.deviceFeature.last_value}
                class="form-control text-center"
                onChange={updateValue}
                step={0.5}
                min={props.deviceFeature.min}
                max={props.deviceFeature.max}
              />
              {props.deviceFeature.unit && (
                <div class="input-group-append">
                  <span class="input-group-text">
                    <Text id={`deviceFeatureUnitShort.${props.deviceFeature.unit}`} />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default NumberDeviceFeature;
