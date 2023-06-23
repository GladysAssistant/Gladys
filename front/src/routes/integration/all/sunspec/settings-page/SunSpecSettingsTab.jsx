import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
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

  updateUrl = e => {
    const updatedConfig = update(this.state.config, {
      sunspecUrl: {
        $set: e.target.value
      }
    });

    this.setState({ config: updatedConfig, updated: true });
  };

  saveConfiguration = async () => {
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

  render({}, { config, loading, error }) {
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

              <p>
                <MarkupText id="integration.sunspec.setup.fronius.description" />
                <Link href="https://www.fronius.com/en/solar-energy/installers-partners/technical-data/all-products/system-monitoring/open-interfaces/modbus-tcp">
                  <i class="fe fe-book-open" /> <Text id="integration.sunspec.setup.fronius.documentation" />
                </Link>
              </p>

              <p>
                <MarkupText id="integration.sunspec.setup.sma.description" />
                <Link href="https://manuals.sma.de/SBxx-1AV-41/fr-FR/1129302539.html">
                  <i class="fe fe-book-open" /> <Text id="integration.sunspec.setup.sma.documentation" />
                </Link>
              </p>

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
