import { Text } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import classNames from 'classnames/bind';

let cx = classNames.bind(style);

const CheckStatus = ({
  matterbridgeEnabled,
  matterbridgeExist,
  matterbridgeRunning,
  dockerBased,
  networkModeValid,
  matterbridgeStatus
}) => {
  let textLabel = null;
  if (matterbridgeStatus === RequestStatus.Getting) {
    textLabel = 'integration.matterbridge.setup.activationMatterbridge';
  } else if (!dockerBased) {
    textLabel = 'integration.matterbridge.status.nonDockerEnv';
  } else if (!networkModeValid) {
    textLabel = 'integration.matterbridge.status.invalidDockerNetwork';
  } else if (matterbridgeEnabled) {
    if (!matterbridgeExist) {
      textLabel = 'integration.matterbridge.status.notInstalled';
    } else if (!matterbridgeRunning) {
      textLabel = 'integration.matterbridge.status.notRunning';
    } else {
      textLabel = 'integration.matterbridge.status.running';
    }
  } else {
    textLabel = 'integration.matterbridge.status.notEnabled';
  }

  return (
    <div>
      <div
        class={cx('d-flex', 'flex-row', 'flex-wrap', 'justify-content-between', 'mr-0', 'ml-0', 'alert', {
          'alert-success': matterbridgeEnabled && matterbridgeExist && matterbridgeRunning,
          'alert-warning': matterbridgeEnabled && matterbridgeExist && !matterbridgeRunning,
          'alert-danger': (matterbridgeEnabled && !matterbridgeExist) || !dockerBased || !networkModeValid,
          'alert-info': !matterbridgeEnabled
        })}
      >
        <div class={cx(style.textAlignMiddleContainer)}>
          <span class={cx(style.textAlignMiddle)}>
            <Text id={textLabel} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default CheckStatus;
