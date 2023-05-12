import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import update from 'immutability-helper';

class SunSpecSettingsTab extends Component {
  loadConfiguration = async () => {
    this.setState({ loading: true, error: null });
    try {
      const config = await this.props.httpClient.get('/api/v1/service/sunspec/configuration');
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

  updateUrl = e => {
    const updatedConfig = update(this.state.config, {
      sunspecUrl: {
        $set: e.target.value
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
    this.setState({ error: null });
    try {
      const config = await this.props.httpClient.post('/api/v1/service/sunspec/configuration', this.state.config);
      this.setState({ config, updated: false });
      await this.props.httpClient.post('/api/v1/service/sunspec/disconnect');
      await this.props.httpClient.post('/api/v1/service/sunspec/connect');
    } catch (e) {
      console.error(e);
      this.setState({ error: e });
    }
  };

  async componentWillMount() {
    await this.loadConfiguration();
  }

  render({}, { config, loading, error, updated }) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.sunspec.setup.title" />
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
                  <Text id="integration.sunspec.setup.errorLabel" />
                </div>
              )}

              {!error && !config && (
                <div class="alert alert-warning">
                  <Text id="integration.sunspec.setup.noConfigLabel" />
                </div>
              )}

              {config && (
                <form>
                  <div class="form-group">
                    <label for="sunspecUrl" class="form-label">
                      <Text id={`integration.sunspec.setup.sunspecUrl`} />
                    </label>
                    <Localizer>
                      <input
                        id="sunspecUrl"
                        name="sunspecUrl"
                        placeholder={<Text id="integration.sunspec.setup.sunspecUrlPlaceholder" />}
                        value={config.sunspecUrl}
                        class="form-control"
                        onInput={this.updateUrl}
                      />
                    </Localizer>
                  </div>
                </form>
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

export default SunSpecSettingsTab;
