import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';
import { RequestStatus } from '../../../utils/consts';

class GatewayBackupKey extends Component {
  toggleShowBackupKey = () => {
    this.setState(({ showBackupKey }) => ({ showBackupKey: !showBackupKey }));
  };

  render(props, { showBackupKey }) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="gateway.backupKeyTitle" />
          </h3>
        </div>
        <div
          class={cx('dimmer', {
            active: props.gatewaySaveBackupKeyStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div class="card-body">
              {!get(props, 'gatewayStatus.connected') && (
                <div class="alert alert-warning">
                  <Text id="gateway.yourGatewayIsNotConnected" />
                </div>
              )}
              <p>
                <Text id="gateway.backupKeyDescription" />
              </p>
              <div class="form-group">
                <label class="form-label">
                  <Text id="gateway.backupKeyTitle" />
                </label>
                {/* masked by default — same eye toggle as the house alarm code */}
                <div class="input-icon">
                  <Localizer>
                    <input
                      type={showBackupKey ? 'text' : 'password'}
                      class="form-control"
                      autoComplete="new-password"
                      onInput={props.updateBackupKey}
                      placeholder={<Text id="gateway.backupKeyPlaceholder" />}
                      value={get(props, 'gatewayBackupKey')}
                    />
                  </Localizer>
                  <Localizer>
                    <button
                      type="button"
                      class="input-icon-addon cursor-pointer"
                      onClick={this.toggleShowBackupKey}
                      aria-pressed={showBackupKey}
                      aria-label={<Text id="gateway.toggleBackupKeyVisibility" />}
                    >
                      <i
                        class={cx('fe', {
                          'fe-eye': !showBackupKey,
                          'fe-eye-off': showBackupKey
                        })}
                      />
                    </button>
                  </Localizer>
                </div>
              </div>
              <div class="form-group">
                <button class="btn btn-success" onClick={props.saveBackupKey}>
                  <Text id="gateway.saveBackupKeyButton" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GatewayBackupKey;
