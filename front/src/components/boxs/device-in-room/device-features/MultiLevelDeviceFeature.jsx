import { Text } from 'preact-i18n';
import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

const MultiLevelDeviceType = ({ children, ...props }) => {
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
            { default: 'arrow-right' }
          )}`}
        />
      </td>
      <td>{props.rowName}</td>

      <td class="text-right py-0">
        <div class="col d-flex align-items-center justify-content-end">
          <input
            type="range"
            value={props.deviceFeature.last_value}
            onChange={updateValue}
            class="custom-range"
            step="1"
            min={props.deviceFeature.min}
            max={props.deviceFeature.max}
            style={{ flex: 1 }}
          />
          <span class="ml-2 text-right">
            {props.deviceFeature.unit ? (
              <span>
                {`${props.deviceFeature.last_value} `}
                <Text id={`deviceFeatureUnitShort.${props.deviceFeature.unit}`} />
              </span>
            ) : (
              <span>{props.deviceFeature.last_value}</span>
            )}
          </span>
        </div>
      </td>
    </tr>
  );
};

export default MultiLevelDeviceType;
