import get from 'get-value';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { TIMER_STATUS } from '../../../../../../server/utils/constants';
import SvgIcon from '../../../icons/SvgIcon';

const colorStatus = value => {
  if (value === 2) {
    return 'success';
  }
  return 'secondary';
};

const TimerStatusDeviceFeature = ({ children, ...props }) => {
  const { device, deviceFeature } = props;
  const { last_value: lastValue } = deviceFeature;

  const value = lastValue === null ? -1 : lastValue;
  const valued = value !== -1;

  const colorClass = `text-${valued ? colorStatus(value) : 'secondary'}`;

  function updateValue(value) {
    props.updateValueWithDebounce(
      props.x,
      props.y,
      device,
      deviceFeature,
      props.deviceIndex,
      props.deviceFeatureIndex,
      value,
      lastValue
    );
  }

  function disable() {
    updateValue(TIMER_STATUS.DISABLED);
  }

  function enable() {
    updateValue(TIMER_STATUS.ENABLED);
  }

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
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-secondary" onClick={enable}>
              <Text id={`deviceFeatureAction.category.timer.status.enabled`} />
            </button>
            <button class="btn btn-sm btn-secondary" onClick={disable}>
              <Text id={`deviceFeatureAction.category.timer.status.disabled`} />
            </button>
          </div>
          <div class={cx('badge badge-d-flex flex-row-reverse', colorClass)}>
            <SvgIcon icon="tabler-drop-circle" />
          </div>
        </div>
      </td>
    </tr>
  );
};

export default TimerStatusDeviceFeature;
