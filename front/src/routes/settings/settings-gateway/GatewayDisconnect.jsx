import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../utils/consts';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import ConfirmSheet from '../../../components/mobile/ConfirmSheet';

// Disconnecting deletes the keys that link the instance to the Gladys Plus account: it is asked
// first, and a failure is said (docs/specs/mobile-pages/settings-pages.md, J)
class GatewayDisconnect extends Component {
  state = { confirmOpen: false };

  ask = () => this.setState({ confirmOpen: true });

  cancel = () => this.setState({ confirmOpen: false });

  confirm = () => {
    this.setState({ confirmOpen: false });
    this.props.disconnect();
  };

  render({ gatewayDisconnectStatus, intl }, { confirmOpen }) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="gateway.disconnectTitle" />
          </h3>
        </div>
        <div
          class={cx('dimmer', {
            active: gatewayDisconnectStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div class="card-body">
              {gatewayDisconnectStatus === RequestStatus.Error && (
                <div class="alert alert-danger" role="alert" data-cy="gateway-disconnect-error">
                  <Text id="gateway.disconnectError" />
                </div>
              )}
              <button onClick={this.ask} class="btn btn-danger btn-block" data-cy="gateway-disconnect">
                <Text id="gateway.disconnectButton" />
              </button>
            </div>
          </div>
        </div>
        <ConfirmSheet
          open={confirmOpen}
          title={get(intl.dictionary, 'gateway.disconnectConfirmTitle')}
          text={<Text id="gateway.disconnectConfirmText" />}
          confirmLabel={<Text id="gateway.disconnectButton" />}
          destructive
          onConfirm={this.confirm}
          onCancel={this.cancel}
          dataCy="gateway-disconnect-confirm"
        />
      </div>
    );
  }
}

export default withIntlAsProp(GatewayDisconnect);
