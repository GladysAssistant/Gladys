import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import update from 'immutability-helper';

class SunSpecSettingsTab extends Component {
  loadConfiguration = async () => {
    this.setState({ loading: true, error: null });
    try {
      const config = await this.props.httpClient.get('/api/v1/service/sunspec/config');
      this.setState({ loading: false, config });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false, error: e });
    }
  };

  updateConfiguration(state, configuration) {
    this.setState(configuration);
  }

  updateUrl = e => {
    const updatedConfig = update(this.state.config, {
      sunspecUrl: {
        $set: e.target.value
      }
    });

    this.setState({ config: updatedConfig, updated: true });
  };

  toggleBdpvActive = () => {
    const updatedConfig = update(this.state.config, {
      bdpvActive: {
        $set: !this.state.config.bdpvActive
      }
    });

    this.setState({ config: updatedConfig, updated: true });
  };

  updateUsername = e => {
    const updatedConfig = update(this.state.config, {
      bdpvUsername: {
        $set: e.target.value
      }
    });

    this.setState({ config: updatedConfig, updated: true });
  };

  updateApiKey = e => {
    const updatedConfig = update(this.state.config, {
      bdpvApiKey: {
        $set: e.target.value
      }
    });

    this.setState({ config: updatedConfig, updated: true });
  };

  showApiKey = () => {
    this.setState({ showApiKey: true });
    setTimeout(() => this.setState({ showApiKey: false }), 5000);
  };

  saveConfiguration = async () => {
    this.setState({ error: null });
    try {
      const config = await this.props.httpClient.post('/api/v1/service/sunspec/config', this.state.config);
      this.setState({ config, updated: false });
      await this.props.httpClient.post('/api/v1/service/sunspec/disconnect');
      await this.props.httpClient.post('/api/v1/service/sunspec/connect');
    } catch (e) {
      this.setState({ error: e });
    }
  };

  async componentWillMount() {
    await this.loadConfiguration();
  }

  render({}, { config, showApiKey, loading, error }) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.sunspec.settings.title" />
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
                  <Text id="integration.sunspec.settings.errorLabel" />
                </div>
              )}

              {!error && !config && (
                <div class="alert alert-warning">
                  <Text id="integration.sunspec.settings.noConfigLabel" />
                </div>
              )}

              <p>
                <MarkupText id="integration.sunspec.settings.fronius.description" />
                <Link href="https://www.fronius.com/en/solar-energy/installers-partners/technical-data/all-products/system-monitoring/open-interfaces/modbus-tcp">
                  <i class="fe fe-book-open" /> <Text id="integration.sunspec.settings.fronius.documentation" />
                </Link>
              </p>

              <p>
                <MarkupText id="integration.sunspec.settings.sma.description" />
                <Link href="https://manuals.sma.de/SBxx-1AV-41/fr-FR/1129302539.html">
                  <i class="fe fe-book-open" /> <Text id="integration.sunspec.settings.sma.documentation" />
                </Link>
              </p>

              {config && (
                <form>
                  <div class="form-group">
                    <label for="sunspecUrl" class="form-label">
                      <Text id={`integration.sunspec.settings.sunspecUrl`} />
                    </label>
                    <Localizer>
                      <input
                        id="sunspecUrl"
                        name="sunspecUrl"
                        placeholder={<Text id="integration.sunspec.settings.sunspecUrlPlaceholder" />}
                        value={config.sunspecUrl}
                        class="form-control"
                        onInput={this.updateUrl}
                      />
                    </Localizer>
                  </div>
                  <div class="form-group">
                    <label for="bdpvActive" class="form-label">
                      <Text id={`integration.sunspec.settings.bdpvActiveLabel`} />
                    </label>
                    <label class="custom-switch">
                      <input
                        type="checkbox"
                        id="bdpvActive"
                        name="bdpvActive"
                        class="custom-switch-input"
                        checked={config.bdpvActive}
                        onClick={this.toggleBdpvActive}
                      />
                      <span class="custom-switch-indicator" />
                      <span class="custom-switch-description">
                        <Text id="integration.sunspec.settings.bdpvActive" />
                      </span>
                    </label>
                  </div>
                </form>
              )}

              {config && config.bdpvActive && (
                <>
                  <div class="form-group">
                    <label for="bdpvUsername" class="form-label">
                      <Text id={`integration.sunspec.settings.userLabel`} />
                    </label>
                    <Localizer>
                      <input
                        id="bdpvUsername"
                        name="bdpvUsername"
                        placeholder={<Text id="integration.sunspec.settings.userPlaceholder" />}
                        value={config.bdpvUsername}
                        class="form-control"
                        onInput={this.updateUsername}
                        autoComplete="no"
                      />
                    </Localizer>
                  </div>
                  <div class="form-group">
                    <label for="bdpvApiKey" class="form-label">
                      <Text id={`integration.sunspec.settings.apiKeyLabel`} />
                    </label>
                    <div class="input-icon mb-3">
                      <Localizer>
                        <input
                          id="bdpvApiKey"
                          name="bdpvApiKey"
                          type={showApiKey ? 'text' : 'password'}
                          placeholder={<Text id="integration.sunspec.settings.apiKeyPlaceholder" />}
                          value={config.bdpvApiKey}
                          class="form-control"
                          onInput={this.updateApiKey}
                          autoComplete="new-password"
                        />
                      </Localizer>
                      <span class="input-icon-addon cursor-pointer" onClick={this.showApiKey}>
                        <i
                          class={cx('fe', {
                            'fe-eye': !showApiKey,
                            'fe-eye-off': showApiKey
                          })}
                        />
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div class="d-flex justify-content-between mt-5">
                <button class="btn btn-success" onClick={this.saveConfiguration}>
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

export default SunSpecSettingsTab;
