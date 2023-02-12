import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import update from 'immutability-helper';

import LANManagerPresenceScanner from './LANManagerPresenceScanner';
import LANManagerIPRange from './LANManagerIPRange';

class LANManagerSettingsTab extends Component {
  loadConfiguration = async () => {
    this.setState({ loading: true, error: null });
    try {
      const config = await this.props.httpClient.get('/api/v1/service/lan-manager/config');
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

  updateMaskConfig = async (maskIndex, value) => {
    const updatedConfig = update(this.state.config, {
      ipMasks: {
        [maskIndex]: {
          $set: value
        }
      }
    });

    this.setState({ config: updatedConfig, updated: true });
  };

  addMaskConfig = async value => {
    const updatedConfig = update(this.state.config, {
      ipMasks: {
        $push: [value]
      }
    });

    this.setState({ config: updatedConfig, updated: true });
  };

  deleteMaskConfig = async maskIndex => {
    const updatedConfig = update(this.state.config, {
      ipMasks: {
        $splice: [[maskIndex, 1]]
      }
    });

    this.setState({ config: updatedConfig, updated: true });
  };

  saveConfig = async () => {
    this.setState({ saving: true, error: null });
    try {
      const config = await this.props.httpClient.post('/api/v1/service/lan-manager/config', this.state.config);
      this.setState({ saving: false, config, updated: false });
    } catch (e) {
      console.error(e);
      this.setState({ saving: false, error: e });
    }
  };

  async componentWillMount() {
    await this.loadConfiguration();
  }

  render({}, { config, loading, error, saving, updated }) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.lanManager.setup.title" />
          </h3>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {error && (
                <div class="alert alert-danger">
                  <Text id="integration.lanManager.setup.errorLabel" />
                </div>
              )}

              {!error && !config && (
                <div class="alert alert-warning">
                  <Text id="integration.lanManager.setup.noConfigLabel" />
                </div>
              )}

              {config && (
                <LANManagerPresenceScanner
                  config={config.presenceScanner}
                  updateConfig={this.updateConfig}
                  disabled={saving}
                />
              )}

              {config && (
                <LANManagerIPRange
                  ipMasks={config.ipMasks}
                  disabled={saving}
                  updateMaskConfig={this.updateMaskConfig}
                  addMaskConfig={this.addMaskConfig}
                  deleteMaskConfig={this.deleteMaskConfig}
                />
              )}

              <div class="d-flex justify-content-between mt-5">
                <button class="btn btn-success" onClick={this.saveConfig} disabled={!updated}>
                  <Text id="global.save" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LANManagerSettingsTab;
