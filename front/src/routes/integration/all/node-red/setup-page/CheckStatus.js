import { Text } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import classNames from 'classnames/bind';

let cx = classNames.bind(style);

const CheckStatus = ({
  nodeRedEnabled,
  nodeRedExist,
  nodeRedRunning,
  dockerBased,
  networkModeValid,
  nodeRedStatus
}) => {
  let textLabel = null;
  if (nodeRedStatus === RequestStatus.Getting) {
    textLabel = 'integration.nodeRed.setup.activationNodeRed';
  } else if (!dockerBased) {
    textLabel = 'integration.nodeRed.status.nonDockerEnv';
  } else if (!networkModeValid) {
    textLabel = 'integration.nodeRed.status.invalidDockerNetwork';
  } else if (nodeRedEnabled) {
    if (!nodeRedExist) {
      textLabel = 'integration.nodeRed.status.notInstalled';
    } else if (!nodeRedRunning) {
      textLabel = 'integration.nodeRed.status.notRunning';
    } else {
      textLabel = 'integration.nodeRed.status.running';
    }
  } else {
    textLabel = 'integration.nodeRed.status.notEnabled';
  }

  return (
    <div>
      <div
        class={cx('d-flex', 'flex-row', 'flex-wrap', 'justify-content-between', 'mr-0', 'ml-0', 'alert', {
          'alert-success': nodeRedEnabled && nodeRedExist && nodeRedRunning,
          'alert-warning': nodeRedEnabled && nodeRedExist && !nodeRedRunning,
          'alert-danger': (nodeRedEnabled && !nodeRedExist) || !dockerBased || !networkModeValid,
          'alert-info': !nodeRedEnabled
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
