import get from 'get-value';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { SIREN_LMH_VOLUME } from '../../../../../../server/utils/constants';

const LMHVolumeDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type, last_value: lastValue } = deviceFeature;

  function updateValue(value) {
    props.updateValueWithDebounce(deviceFeature, value);
  }

  function low() {
    updateValue(SIREN_LMH_VOLUME.LOW);
  }

  function medium() {
    updateValue(SIREN_LMH_VOLUME.MEDIUM);
  }

  function high() {
    updateValue(SIREN_LMH_VOLUME.HIGH);
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
                active: lastValue === SIREN_LMH_VOLUME.LOW
              })}
              onClick={low}
            >
              <Text id={`deviceFeatureAction.category.${category}.${type}.low`} plural={SIREN_LMH_VOLUME.HIGH} />
            </button>
            <button
              class={cx('btn btn-sm btn-secondary', {
                active: lastValue === SIREN_LMH_VOLUME.MEDIUM
              })}
              onClick={medium}
            >
              <Text id={`deviceFeatureAction.category.${category}.${type}.medium`} plural={SIREN_LMH_VOLUME.HIGH} />
            </button>
            <button
              class={cx('btn btn-sm', 'btn-secondary', {
                active: lastValue === SIREN_LMH_VOLUME.HIGH
              })}
              onClick={high}
            >
              <Text id={`deviceFeatureAction.category.${category}.${type}.high`} plural={SIREN_LMH_VOLUME.HIGH} />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default LMHVolumeDeviceFeature;
