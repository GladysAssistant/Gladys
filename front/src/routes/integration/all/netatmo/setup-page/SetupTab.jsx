import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import { SCOPES, STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { STATE } from '../../../../../../../server/utils/constants';

class SetupTab extends Component {

  getRedirectUri = async () => {
    try {
      const { result } = await this.props.httpClient.post('/api/v1/service/netatmo/connect');
      const redirectUri = `${result.authUrl}&redirect_uri=${encodeURIComponent(this.props.redirectUriNetatmoSetup)}`
      this.setState({
        redirectUri: redirectUri,
      });
    } catch (e) {
      console.error(e);
    }
  };

  componentWillMount() {
    this.getNetatmoConfiguration();
  }

  async getNetatmoConfiguration() {
    let netatmoUsername = '';
    let netatmoClientId = '';
    let netatmoClientSecret = '';
    let netatmoScopesEnergy = '';

    this.setState({
      netatmoGetSettingsStatus: RequestStatus.Getting,
      netatmoUsername,
      netatmoClientId,
      netatmoClientSecret,
      netatmoScopesEnergy,
    });
    try {
      const { value: username } = await this.props.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_USERNAME');
      netatmoUsername = username;

      const { value: clientId } = await this.props.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_CLIENT_ID');
      netatmoClientId = clientId;

      const { value: clientSecret } = await this.props.httpClient.get(
        '/api/v1/service/netatmo/variable/NETATMO_CLIENT_SECRET'
      );
      netatmoClientSecret = clientSecret;

      const { value: scopeEnergy } = await this.props.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_SCOPE_ENERGY');
      netatmoScopesEnergy = scopeEnergy;

      this.setState({
        netatmoGetSettingsStatus: RequestStatus.Success,
        netatmoUsername,
        netatmoClientId,
        netatmoClientSecret,
        netatmoScopesEnergy,
      });
    } catch (e) {
      console.log(e)
      this.setState({
        netatmoGetSettingsStatus: RequestStatus.Error
      });
    }
  }

  async disconnectNetatmo(e) {
    e.preventDefault();
    try {
      await this.props.httpClient.post('/api/v1/service/netatmo/disconnect');

      await this.setState({
        netatmoSaveSettingsStatus: RequestStatus.Success,
      });
    } catch (e) {
      await this.setState({
        netatmoSaveSettingsStatus: RequestStatus.Error
      });
    }
  }

  async saveNetatmoConfiguration(e) {
    e.preventDefault();

    await this.setState({
      netatmoSaveSettingsStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_USERNAME', {
        value: this.state.netatmoUsername.trim()
      });

      await this.props.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_CLIENT_ID', {
        value: this.state.netatmoClientId.trim()
      });

      await this.props.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_CLIENT_SECRET', {
        value: this.state.netatmoClientSecret.trim()
      });

      await this.props.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_SCOPE_ENERGY', {
        value: this.state.netatmoScopesEnergy.trim()
      });

      await this.setState({
        netatmoSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      await this.setState({
        netatmoSaveSettingsStatus: RequestStatus.Error
      });
    }
    try {
      await this.setState({
        netatmoSaveSettingsStatus: RequestStatus.Getting
      });
      // start service
      await this.getRedirectUri();
      // Open a new tab for authorization URL
      if (this.state.redirectUri) {
        window.location.href = this.state.redirectUri // window.open(this.state.redirectUri, '_blank');
        await this.setState({
          netatmoSaveSettingsStatus: RequestStatus.Success
        });
      } else {
        console.error('Missing redirect URL');
        await this.setState({
          netatmoSaveSettingsStatus: RequestStatus.Error
        });
      }
      await this.setState({
        netatmoSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error('erreur', e);
      await this.setState({
        netatmoSaveSettingsStatus: RequestStatus.Error
      });
    }
  }

  updateConfiguration(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  handleCheckboxChange = (scope, isChecked) => {
    let newScopes = new Set(this.state.netatmoScopesEnergy.split(' '));

    if (isChecked) {
      newScopes.add(scope);
    } else {
      newScopes.delete(scope);
    }

    const newScopesString = Array.from(newScopes).filter(Boolean).join(' ');
    this.setState({ netatmoScopesEnergy: newScopesString });
  }

  render({ children, props, notOnGladysGateway, errored, errorCloseWindow, accessDenied, loading, netatmoConnected }, state) {
    const scopesArray = this.state.netatmoScopesEnergy.split(' ');
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.netatmo.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: state.netatmoSaveSettingsStatus === RequestStatus.Getting || loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {errored && (
                <p class="alert alert-danger">
                  <Text id="integration.netatmo.setup.error" />
                </p>
              )}
              {accessDenied && (
                <p class="text-center alert alert-warning">
                  <Text id="integration.netatmo.setup.declineAuthorize" />
                </p>
              )}
              {errorCloseWindow && (
                <p class="text-center alert alert-danger">
                  <Text id="integration.netatmo.setup.errorCloseWindow" />
                </p>
              )}
              {console.log(netatmoConnected)}
              {!accessDenied && !errorCloseWindow && (
                netatmoConnected === STATUS.CONNECTING && (
                  <p class="text-center alert alert-info">
                    <Text id="integration.netatmo.setup.connecting" />
                  </p>
                )
                || netatmoConnected === STATUS.NOT_INITIALIZED && (
                  <p class="text-center alert alert-warning">
                    <Text id="integration.netatmo.setup.notConfigured" />
                  </p>
                )
                || netatmoConnected === STATUS.PROCESSING_TOKEN && (
                  <p class="text-center alert alert-warning">
                    <Text id="integration.netatmo.setup.processingToken" />
                  </p>
                )
                || netatmoConnected === STATUS.CONNECTED && (
                  <p class="text-center alert alert-success">
                    <Text id="integration.netatmo.setup.connect" />
                  </p>
                )
                || netatmoConnected === STATUS.DISCONNECTED && (
                  <p class="text-center alert alert-danger">
                    <Text id="integration.netatmo.setup.disconnect" />
                  </p>
                ))}
              <p>
                <MarkupText id="integration.netatmo.setup.description" />
                <MarkupText id="integration.netatmo.setup.descriptionCreateAccount" />
                <MarkupText id="integration.netatmo.setup.descriptionCreateProject" />
                <MarkupText id="integration.netatmo.setup.descriptionGetKeys" />
              </p>

              <form>
                <div class="form-group">
                  <label for="netatmoUsername" class="form-label">
                    <Text id={`integration.netatmo.setup.usernameLabel`} />
                  </label>
                  <Localizer>
                    <input
                      name="netatmoUsername"
                      type="text"
                      placeholder={<Text id="integration.netatmo.setup.usernamePlaceholder" />}
                      value={state.netatmoUsername}
                      class="form-control"
                      onInput={this.updateConfiguration.bind(this)}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label htmlFor="netatmoClientId" className="form-label">
                    <Text id={`integration.netatmo.setup.clientIdLabel`} />
                  </label>
                  <Localizer>
                    <input
                      name="netatmoClientId"
                      type="text"
                      placeholder={<Text id="integration.netatmo.setup.clientIdPlaceholder" />}
                      value={state.netatmoClientId}
                      className="form-control"
                      onInput={this.updateConfiguration.bind(this)}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label htmlFor="netatmoClientSecret" className="form-label">
                    <Text id={`integration.netatmo.setup.clientSecretLabel`} />
                  </label>
                  <Localizer>
                    <input
                      name="netatmoClientSecret"
                      type="text"
                      placeholder={<Text id="integration.netatmo.setup.clientSecretPlaceholder" />}
                      value={state.netatmoClientSecret}
                      className="form-control"
                      onInput={this.updateConfiguration.bind(this)}
                    />
                  </Localizer>
                </div>

                <div className="form-group">
                  <label htmlFor="netatmoScope" className="form-label">
                    <Text id={`integration.netatmo.setup.scopeLabel`} />
                    <Text id={`integration.netatmo.setup.scopes.netatmoEnergyTitle`} />
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: '10px' }}>
                    {Object.entries(SCOPES.ENERGY).map(([key, value]) => (
                      <label key={key} style={{ marginRight: '20px', marginBottom: '10px', alignItems: 'center', display: 'flex' }}>
                        <input
                          type="checkbox"
                          checked={scopesArray.includes(value)}
                          onChange={e => this.handleCheckboxChange(value, e.target.checked)}
                          style={{ marginRight: '5px' }}
                        />
                        <Text id={`integration.netatmo.setup.scopes.ENERGY.${key.replace(/_/g, '').toLowerCase()}`} />
                      </label>
                    ))}
                  </div>
                </div>
                {notOnGladysGateway && (
                  <div class="d-flex justify-content-between mt-5">
                    <Localizer>
                      <button type="submit" class="btn btn-success" onClick={this.saveNetatmoConfiguration.bind(this)}>
                        {netatmoConnected !== STATUS.CONNECTED && (
                          <Text id="integration.netatmo.setup.saveAndConnectLabel" />
                        )}
                        {netatmoConnected === STATUS.CONNECTED && (
                          <Text id="integration.netatmo.setup.newSaveAndReconnectLabel" />
                        )}
                      </button>
                    </Localizer>
                    {notOnGladysGateway && netatmoConnected === STATUS.CONNECTED && (
                      <button
                        onClick={this.disconnectNetatmo.bind(this)}
                        class="btn btn-danger"
                        disabled={netatmoConnected === STATUS.DISCONNECTING}
                      >
                        <Text id="integration.netatmo.setup.disconnectLabel" />
                      </button>
                    )}
                  </div>
                )}

              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,session,httpClient', {})(SetupTab);
