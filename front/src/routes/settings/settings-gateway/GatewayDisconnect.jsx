import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../utils/consts';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import ConfirmSheet from '../../../components/mobile/ConfirmSheet';
import kitStyle from '../../../components/mobile/kit.css';

// Disconnecting deletes the keys that link the instance to the Gladys Plus account, the backup
// key included: it is asked first, saying so, and a failure is said
// (docs/specs/mobile-pages/settings-pages.md, J)
class GatewayDisconnect extends Component {
  // `attempted`: the status of the request lives in the store and outlives this page. An error
  // is only shown for a disconnection asked from this visit, not for one that failed last time.
  state = { confirmOpen: false, attempted: false };

  ask = () => this.setState({ confirmOpen: true });

  cancel = () => this.setState({ confirmOpen: false });

  // Not in the state: two clicks on the confirming button land before the dialog is gone
  disconnecting = false;

  confirm = async () => {
    // one confirmation, one request
    if (this.disconnecting) {
      return;
    }
    this.disconnecting = true;
    this.setState({ confirmOpen: false, attempted: true });
    try {
      await this.props.disconnect();
    } finally {
      this.disconnecting = false;
    }
  };

  render({ gatewayDisconnectStatus, intl }, { confirmOpen, attempted }) {
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
              {attempted && gatewayDisconnectStatus === RequestStatus.Error && (
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
        >
          <p class={kitStyle.sheetText} data-cy="gateway-disconnect-backup-key">
            <strong>
              <Text id="gateway.disconnectConfirmBackupKey" />
            </strong>
          </p>
        </ConfirmSheet>
      </div>
    );
  }
}

export default withIntlAsProp(GatewayDisconnect);
