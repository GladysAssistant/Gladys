import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { VACBOT_MODE } from '../../../../../server/utils/constants';

const VacbotModeControls = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type, last_value: lastValue } = deviceFeature;

  function clean() {
    props.updateValue(deviceFeature, VACBOT_MODE.CLEAN);
  }

  function pause() {
    props.updateValue(deviceFeature, VACBOT_MODE.PAUSE);
  }

  function charge() {
    props.updateValue(deviceFeature, VACBOT_MODE.CHARGE);
  }

  function stop() {
    props.updateValue(deviceFeature, VACBOT_MODE.STOP);
  }

  return (
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
  );
};

export default VacbotModeControls;
