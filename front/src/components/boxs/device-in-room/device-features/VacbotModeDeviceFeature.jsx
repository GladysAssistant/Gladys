import get from 'get-value';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { getDeviceName } from '../../../../utils/device';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { VACBOT_MODE } from '../../../../../../server/utils/constants';

const VacbotModeDeviceFeature = ({ children, ...props }) => {
  const { device, deviceFeature } = props;
  const { category, type, last_value: lastValue } = deviceFeature;

  function updateValue(value) {
    props.updateValueWithDebounce(deviceFeature, value);
  }

  function clean() {
    updateValue(VACBOT_MODE.CLEAN);
  }

  function pause() {
    updateValue(VACBOT_MODE.PAUSE);
  }

  function charge() {
    updateValue(VACBOT_MODE.CHARGE);
  }

  function stop() {
    updateValue(VACBOT_MODE.STOP);
  }

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'sliders' })}`} />
      </td>
      <td>{getDeviceName(device, deviceFeature)}</td>

      <td class="py-0">
        <div class="d-flex justify-content-end">
          <div class="btn-group" role="group">
            <Localizer>
              <button
                class={cx('btn btn-sm btn-secondary', 'fe', 'fe-play', {
                  active: lastValue === VACBOT_MODE.CLEAN
                })}
                onClick={clean}
                title={<Text id={`deviceFeatureAction.category.${category}.${type}.clean`} />}
              />
            </Localizer>
            <Localizer>
              <button
                class={cx('btn btn-sm btn-secondary', 'fe', 'fe-pause', {
                  active: lastValue === VACBOT_MODE.PAUSE
                })}
                onClick={pause}
                title={<Text id={`deviceFeatureAction.category.${category}.${type}.pause`} />}
              />
            </Localizer>
            <Localizer>
              <button
                class={cx('btn btn-sm', 'btn-secondary', 'fe', 'fe-square', {
                  active: lastValue === VACBOT_MODE.STOP
                })}
                onClick={stop}
                title={<Text id={`deviceFeatureAction.category.${category}.${type}.stop`} />}
              />
            </Localizer>
            <Localizer>
              <button
                class={cx('btn btn-sm', 'btn-secondary', 'fe', 'fe-home', {
                  active: lastValue === VACBOT_MODE.CHARGE
                })}
                onClick={charge}
                title={<Text id={`deviceFeatureAction.category.${category}.${type}.charge`} />}
              />
            </Localizer>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default VacbotModeDeviceFeature;
