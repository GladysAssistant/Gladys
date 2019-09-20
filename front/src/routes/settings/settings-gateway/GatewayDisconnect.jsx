import { Text } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../utils/consts';

const GatewayUsersList = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="gateway.disconnectTitle" />
      </h3>
    </div>
    <div
      class={cx('dimmer', {
        active: props.gatewayDisconnectStatus === RequestStatus.Getting
      })}
    >
      <div class="loader" />
      <div class="dimmer-content">
        <div class="card-body">
          <button onClick={props.disconnect} class="btn btn-danger btn-block">
            <Text id="gateway.disconnectButton" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default GatewayUsersList;
