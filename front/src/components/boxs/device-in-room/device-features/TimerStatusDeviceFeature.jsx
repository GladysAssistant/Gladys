import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

const TimerStatusDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { last_value: lastValue } = deviceFeature;

  const value = lastValue === null ? -1 : lastValue;

  return (
    <tr>
      <td>
        <i
          class={`fe fe-${get(
            DeviceFeatureCategoriesIcon,
            `${props.deviceFeature.category}.${props.deviceFeature.type}`,
            { default: 'watch' }
          )}`}
        />
      </td>
      <td>{props.deviceFeature.name}</td>
      <td class="py-0">
        <div class="d-flex justify-content-end">
          {value == 0 && (
            <span class="badge badge-danger">
              <Text id={`deviceFeatureAction.category.timer.status.disabled`} />
            </span>
          )}
          {value == 1 && (
            <span class="badge badge-info">
              <Text id={`deviceFeatureAction.category.timer.status.enabled`} />
            </span>
          )}
          {value == 2 && (
            <span class="badge badge-success">
              <Text id={`deviceFeatureAction.category.timer.status.active`} />
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TimerStatusDeviceFeature;
