import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import classNames from 'classnames/bind';

let cx = classNames.bind(style);

class CheckStatus extends Component {
  render({ nodeRedEnabled, nodeRedExist, nodeRedRunning, toggle, dockerBased, networkModeValid, nodeRedStatus }, {}) {

    let buttonLabel = null;
    let textLabel = null;
    if (nodeRedStatus === RequestStatus.Getting) {
      buttonLabel = 'integration.nodeRed.setup.activationNodeRed';
      textLabel = 'integration.nodeRed.setup.activationNodeRed';
    } else if (!dockerBased) {
      textLabel = 'integration.nodeRed.status.nonDockerEnv';
    } else if (!networkModeValid) {
      textLabel = 'integration.nodeRed.status.invalidDockerNetwork';
    } else if (nodeRedEnabled) {
      buttonLabel = 'integration.nodeRed.setup.disableNodeRed';
      if (!nodeRedExist) {
        textLabel = 'integration.nodeRed.status.notInstalled';
      } else if (!nodeRedRunning) {
        textLabel = 'integration.nodeRed.status.notRunning';
      } else {
        textLabel = 'integration.nodeRed.status.running';
      }
    } else {
      buttonLabel = 'integration.nodeRed.setup.enableNodeRed';
      textLabel = 'integration.nodeRed.status.notEnabled';
    }

    return (
      <div>
        <div
          class={cx('row', 'mr-0', 'ml-0', 'alert', {
            'alert-success': nodeRedEnabled && nodeRedExist && nodeRedRunning,
            'alert-warning': nodeRedEnabled && nodeRedExist && !nodeRedRunning,
            'alert-danger': (nodeRedEnabled && !nodeRedExist) || !dockerBased || !networkModeValid,
            'alert-info': !nodeRedEnabled
          })}
        >
          <div class={cx('col', style.textAlignMiddleContainer)}>
            <span class={cx(style.textAlignMiddle)}>
              <Text id={textLabel} />
            </span>
          </div>

          {buttonLabel && (
            <div class="col-3">
              <button
                onClick={toggle}
                className="btn btn-primary btn-block"
                disabled={!dockerBased || !networkModeValid || nodeRedStatus === RequestStatus.Getting}
              >
                <Text id={buttonLabel} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default CheckStatus;
