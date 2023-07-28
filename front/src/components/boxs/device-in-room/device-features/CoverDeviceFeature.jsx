import get from 'get-value';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { COVER_STATE } from '../../../../../../server/utils/constants';

const CoverDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type, last_value: lastValue } = deviceFeature;

  function updateValue(value) {
    props.updateValueWithDebounce(deviceFeature, value);
  }

  function open() {
    updateValue(COVER_STATE.OPEN);
  }

  function close() {
    updateValue(COVER_STATE.CLOSE);
  }

  function stop() {
    updateValue(COVER_STATE.STOP);
  }

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'sliders' })}`} />
      </td>
      <td>{props.rowName}</td>

      <td class="py-0">
        <div class="d-flex justify-content-end">
          <div class="btn-group" role="group">
            <button
              class={cx('btn btn-sm btn-secondary', {
                active: lastValue === COVER_STATE.OPEN
              })}
              onClick={open}
            >
              <Text id={`deviceFeatureAction.category.${category}.${type}`} plural={COVER_STATE.OPEN} />
            </button>
            <button
              class={cx('btn btn-sm btn-secondary', 'fe', 'fe-pause', {
                active: lastValue === COVER_STATE.STOP
              })}
              onClick={stop}
            />
            <button
              class={cx('btn btn-sm', 'btn-secondary', {
                active: lastValue === COVER_STATE.CLOSE
              })}
              onClick={close}
            >
              <Text id={`deviceFeatureAction.category.${category}.${type}`} plural={COVER_STATE.CLOSE} />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default CoverDeviceFeature;
