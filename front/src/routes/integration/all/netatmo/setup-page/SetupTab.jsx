import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import { SCOPES } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

const SCOPES_ENERGY = SCOPES.ENERGY;
const redirectUri = `${window.location.origin}/dashboard/integration/device/netatmo/setup`

class SetupTab extends Component {
  async componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log(this.state.netatmoState)
    if (urlParams.size > 0) {
      console.log(urlParams)
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const accessToken = urlParams.get('access_token');
      console.log(accessToken)
      if (code && state) {
        try {
          const netatmoState = this.state.netatmoState
          // Ici, effectuez l'appel à l'API Netatmo pour échanger le code contre un token
          console.log(code)
          console.log(state)
          console.log(netatmoState)
          await this.props.httpClient.post('/api/v1/service/netatmo/getAccessToken', { codeOAuth: code, redirectUri: redirectUri });



          // const tokenResponse = await httpClient.post('URL_API_NETATMO', { code });
          // const accessToken = tokenResponse.data.access_token;
          // Ensuite, envoyez le token d'accès au serveur Gladys pour le stocker
          await httpClient.post('/api/v1/service/netatmo/variable/NETATMO_ACCESS_TOKEN', {
            value: accessToken.trim()
          });

          // Redirection vers la page de configuration ou de succès
          route('/dashboard/integration/device/netatmo/setup');
        } catch (e) {
          console.error(`Erreur lors de l'échange du code d'authentification:`, e);
          // Gérer l'erreur ici
          window.location.href = authUrl;
          route('/dashboard/integration/device/netatmo/setup');
        }
      } else {
        route('/dashboard/integration/device/netatmo/setup');
      }
    }
  }
  componentWillMount() {
    this.getNetatmoConfiguration();
  }

  async getNetatmoConfiguration() {
    let netatmoUsername = '';
    let netatmoPassword = '';
    let netatmoClientId = '';
    let netatmoClientSecret = '';
    let netatmoState = '';
    let netatmoScopesEnergy = '';

    this.setState({
      netatmoGetSettingsStatus: RequestStatus.Getting,
      netatmoUsername,
      netatmoPassword,
      netatmoClientId,
      netatmoClientSecret,
      netatmoState,
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
        netatmoPassword,
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

  async saveNetatmoConfiguration(e) {
    let netatmoState = '';
    e.preventDefault();
    this.setState({
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


      // start service
      const { result } = await this.props.httpClient.post('/api/v1/service/netatmo/connect');
      console.log(result)
      console.log(redirectUri)
      const authUrl = `${result.authUrl}&redirect_uri=${encodeURIComponent(redirectUri)}`
      console.log(authUrl)
      console.log(result.state.trim()) // bca64c401aa1563e779f07dc64b1638f

      await this.props.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_STATE_OAUTH', {
        value: result.state.trim()
      });
      window.location.href = authUrl;
      this.setState({
        netatmoState,
        netatmoSaveSettingsStatus: RequestStatus.Success
      });
      // await startNetatmoService();
      // await this.props.httpClient.post('/api/v1/service/netatmo/start');
    } catch (e) {
      bca64c401aa1563e779f07dc64b1638f
      this.setState({
        netatmoSaveSettingsStatus: RequestStatus.Error
      });
    }
  }

  handleCheckboxChange = (scope, isChecked) => {
    let newScopes = new Set(this.state.netatmoScopesEnergy.split(' ')); // Créer un Set à partir des scopes actuels

    if (isChecked) {
      newScopes.add(scope); // Ajouter le scope si la case est cochée
    } else {
      newScopes.delete(scope); // Supprimer le scope si la case est décochée
    }

    // Transformer le Set en chaîne, séparée par des espaces
    const newScopesString = Array.from(newScopes).filter(Boolean).join(' ');
    this.setState({ netatmoScopesEnergy: newScopesString });
  }

  updateConfiguration(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  render(props, state) {
    const scopesArray = this.state.netatmoScopesEnergy.split(' '); // Convertir la chaîne en tableau

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
              active: state.netatmoSaveSettingsStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
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

                {/* <div class="form-group">
                  <label htmlFor="netatmoScope" className="form-label">
                    <Text id={`integration.netatmo.setup.scopeLabel`} />
                  </label>
                  <Localizer>
                    <input
                      name="netatmoScope"
                      type="text"
                      placeholder={<Text id="integration.netatmo.setup.scopePlaceholder" />}
                      value={state.netatmoScopes}
                      className="form-control"
                      onInput={this.updateConfiguration.bind(this)}
                    />
                  </Localizer>
                </div> */}

                <div class="row mt-5">
                  <div class="col">
                    <button type="submit" class="btn btn-success" onClick={this.saveNetatmoConfiguration.bind(this)}>
                      <Text id="integration.netatmo.setup.saveLabel" />
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

export default connect('httpClient,currentUrl', {})(SetupTab);
