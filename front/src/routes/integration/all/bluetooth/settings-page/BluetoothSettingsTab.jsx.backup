import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import update from 'immutability-helper';

import CheckBluetoothPanel from '../commons/CheckBluetoothPanel';
import BluetoothPresenceScanner from './BluetoothPresenceScanner';

class BluetoothSettingsTab extends Component {
  loadConfiguration = async () => {
    this.setState({ loading: true, error: null });
    try {
      const config = await this.props.httpClient.get('/api/v1/service/bluetooth/config');
      this.setState({ loading: false, config });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false, error: e });
    }
  };

  updateConfig = async (configGroup, configItem, value) => {
    const updatedConfig = update(this.state.config, {
      [configGroup]: {
        [configItem]: {
          $set: value
        }
      }
    });

    this.setState({ config: updatedConfig, updated: true });
  };

  saveConfig = async () => {
    this.setState({ saving: true, error: null });
    try {
      const config = await this.props.httpClient.post('/api/v1/service/bluetooth/config', this.state.config);
      this.setState({ saving: false, config, updated: false });
    } catch (e) {
      console.error(e);
      this.setState({ saving: false, error: e });
    }
  };

  scanPresence = async () => {
    try {
      await this.props.httpClient.post('/api/v1/service/bluetooth/presence');
    } catch (e) {
      console.error(e);
    }
  };

  async componentWillMount() {
    await this.loadConfiguration();
  }

  render({ bluetoothStatus = {} }, { config, loading, error, saving, updated }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.bluetooth.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <CheckBluetoothPanel />

          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {error && (
                <div class="alert alert-danger">
                  <Text id="integration.bluetooth.setup.errorLabel" />
                </div>
              )}

              {!error && !config && (
                <div class="alert alert-warning">
                  <Text id="integration.bluetooth.setup.noConfigLabel" />
                </div>
              )}

              {config && (
                <BluetoothPresenceScanner
                  config={config.presenceScanner}
                  updateConfig={this.updateConfig}
                  disabled={saving}
                />
              )}

              <div class="d-flex justify-content-between mt-5">
                <button class="btn btn-success" onClick={this.saveConfig} disabled={!updated}>
                  <Text id="integration.bluetooth.setup.saveLabel" />
                </button>

                <button
                  class="btn btn-outline-primary"
                  onClick={this.scanPresence}
                  disabled={saving || bluetoothStatus.scanning || !bluetoothStatus.ready}
                >
                  <i class="fe fe-radio mr-2" />
                  <Text id="integration.bluetooth.setup.presenceScannerButton" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BluetoothSettingsTab;
