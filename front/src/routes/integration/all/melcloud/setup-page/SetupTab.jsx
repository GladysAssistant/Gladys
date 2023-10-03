import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class SetupTab extends Component {
  showPasswordTimer = null;

  componentWillMount() {
    this.getConfiguration();
  }

  async getConfiguration() {
    let melCloudUsername = '';
    let melCloudPassword = '';

    this.setState({
      melcloudGetSettingsStatus: RequestStatus.Getting,
      melCloudUsername,
      melCloudPassword
    });
    try {
      const { value: username } = await this.props.httpClient.get(
        '/api/v1/service/melcloud/variable/MELCLOUD_USERNAME'
      );
      melCloudUsername = username;

      const { value: password } = await this.props.httpClient.get(
        '/api/v1/service/melcloud/variable/MELCLOUD_PASSWORD'
      );
      melCloudPassword = password;

      this.setState({
        melcloudGetSettingsStatus: RequestStatus.Success,
        melCloudUsername,
        melCloudPassword
      });
    } catch (e) {
      this.setState({
        melcloudGetSettingsStatus: RequestStatus.Error
      });
    }
  }

  async saveConfiguration(e) {
    e.preventDefault();
    this.setState({
      melcloudSaveSettingsStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post('/api/v1/service/melcloud/variable/MELCLOUD_USERNAME', {
        value: this.state.melCloudUsername.trim()
      });

      await this.props.httpClient.post('/api/v1/service/melcloud/variable/MELCLOUD_PASSWORD', {
        value: this.state.melCloudPassword.trim()
      });

      // start service
      await this.props.httpClient.post('/api/v1/service/melcloud/start');
      this.setState({
        melcloudSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        melcloudSaveSettingsStatus: RequestStatus.Error
      });
    }
  }

  updateConfiguration(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  togglePassword = () => {
    const { showPassword } = this.state;

    if (this.showPasswordTimer) {
      clearTimeout(this.showPasswordTimer);
      this.showPasswordTimer = null;
    }

    this.setState({ showPassword: !showPassword });

    if (!showPassword) {
      this.showPasswordTimer = setTimeout(() => this.setState({ showPassword: false }), 5000);
    }
  };

  render(props, state) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.melcloud.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: state.melcloudSaveSettingsStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <p>
                <MarkupText id="integration.melcloud.setup.description" />
              </p>

              <form>
                <div class="form-group">
                  <label for="melCloudUsername" class="form-label">
                    <Text id={`integration.melcloud.setup.username`} />
                  </label>
                  <Localizer>
                    <input
                      name="melCloudUsername"
                      type="text"
                      placeholder={<Text id="integration.melcloud.setup.usernamePlaceholder" />}
                      value={state.melCloudUsername}
                      class="form-control"
                      onInput={this.updateConfiguration.bind(this)}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label htmlFor="melCloudPassword" className="form-label">
                    <Text id={`integration.melcloud.setup.password`} />
                  </label>
                  <div class="input-icon mb-3">
                    <Localizer>
                      <input
                        name="melCloudPassword"
                        type={state.showPassword ? 'text' : 'password'}
                        placeholder={<Text id="integration.melcloud.setup.passwordPlaceholder" />}
                        value={state.melCloudPassword}
                        className="form-control"
                        onInput={this.updateConfiguration.bind(this)}
                      />
                    </Localizer>
                    <span class="input-icon-addon cursor-pointer" onClick={this.togglePassword}>
                      <i
                        class={cx('fe', {
                          'fe-eye': !state.showPassword,
                          'fe-eye-off': state.showPassword
                        })}
                      />
                    </span>
                  </div>
                </div>

                <div class="row mt-5">
                  <div class="col">
                    <button type="submit" class="btn btn-success" onClick={this.saveConfiguration.bind(this)}>
                      <Text id="integration.melcloud.setup.saveLabel" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(SetupTab);
