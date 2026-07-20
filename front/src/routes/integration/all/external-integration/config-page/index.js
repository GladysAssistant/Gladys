import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import get from 'get-value';

import ExternalIntegrationPage from '../ExternalIntegrationPage';
import ConfigTab from './ConfigTab';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class ExternalIntegrationConfigPage extends Component {
  loadData = async () => {
    this.setState({ loadStatus: RequestStatus.Getting });
    const { selector } = this.props;
    try {
      const [integration, configResponse] = await Promise.all([
        this.props.httpClient.get(`/api/v1/external_integration/${selector}`),
        this.props.httpClient.get(`/api/v1/external_integration/${selector}/config`)
      ]);
      if (selector !== this.props.selector) {
        // a newer request has started since, discard this stale result
        return;
      }
      const configValues = this.buildConfigValues(integration, configResponse);
      this.setState({
        integration,
        configValues,
        configuredSecrets: configResponse.configured_secrets || [],
        touchedSecrets: {},
        loadStatus: RequestStatus.Success
      });
      if (get(integration, 'manifest.type') === 'communication') {
        await this.loadContact();
      }
    } catch (e) {
      console.error(e);
      if (selector !== this.props.selector) {
        return;
      }
      // never keep the data of a previous integration displayed and savable
      this.setState({
        loadStatus: RequestStatus.Error,
        integration: null,
        configValues: {},
        configuredSecrets: [],
        touchedSecrets: {}
      });
    }
  };

  buildConfigValues = (integration, configResponse) => {
    const schema = get(integration, 'manifest.config_schema') || [];
    const configValues = Object.assign({}, configResponse.config);
    schema.forEach(field => {
      const currentValue = configValues[field.key];
      if ((currentValue === undefined || currentValue === null) && field.type !== 'secret') {
        if (field.default !== undefined) {
          configValues[field.key] = field.default;
        }
      }
    });
    return configValues;
  };

  updateConfigValue = (field, value) => {
    const configValues = Object.assign({}, this.state.configValues, { [field.key]: value });
    const newState = { configValues, saveConfigStatus: null };
    if (field.type === 'secret') {
      newState.touchedSecrets = Object.assign({}, this.state.touchedSecrets, { [field.key]: true });
    }
    this.setState(newState);
  };

  saveConfig = async e => {
    if (e) {
      e.preventDefault();
    }
    this.setState({ saveConfigStatus: RequestStatus.Getting });
    const { integration, configValues = {}, touchedSecrets = {} } = this.state;
    const schema = get(integration, 'manifest.config_schema') || [];
    const config = {};
    schema.forEach(field => {
      const value = configValues[field.key];
      if (field.type === 'secret') {
        // A secret set to null means "unchanged" on the server side
        config[field.key] = touchedSecrets[field.key] ? value : null;
      } else if (field.type === 'number') {
        // empty or malformed numeric inputs are simply not sent
        // (the server merge is partial, absent keys stay unchanged)
        const numericValue = value === '' || value === undefined || value === null ? NaN : Number(value);
        if (!Number.isNaN(numericValue)) {
          config[field.key] = numericValue;
        }
      } else if (field.type === 'boolean') {
        config[field.key] = !!value;
      } else if (value !== undefined && value !== null) {
        config[field.key] = value;
      }
    });
    try {
      const configResponse = await this.props.httpClient.post(
        `/api/v1/external_integration/${this.props.selector}/config`,
        { config }
      );
      const configValuesRefreshed = this.buildConfigValues(this.state.integration, configResponse);
      this.setState({
        configValues: configValuesRefreshed,
        configuredSecrets: configResponse.configured_secrets || [],
        touchedSecrets: {},
        saveConfigStatus: RequestStatus.Success
      });
    } catch (err) {
      console.error(err);
      this.setState({ saveConfigStatus: RequestStatus.Error });
    }
  };

  loadContact = async () => {
    try {
      const contact = await this.props.httpClient.get(`/api/v1/external_integration/${this.props.selector}/contact`);
      this.setState({ contact });
    } catch (e) {
      console.error(e);
    }
  };

  generateLinkCode = async () => {
    this.setState({ linkStatus: RequestStatus.Getting });
    try {
      const { code } = await this.props.httpClient.post(
        `/api/v1/external_integration/${this.props.selector}/link_code`,
        {}
      );
      this.setState({ linkCode: code, linkStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ linkStatus: RequestStatus.Error });
    }
  };

  unlinkContact = async () => {
    this.setState({ linkStatus: RequestStatus.Getting });
    try {
      await this.props.httpClient.delete(`/api/v1/external_integration/${this.props.selector}/contact`);
      this.setState({ linkCode: null, linkStatus: RequestStatus.Success });
      await this.loadContact();
    } catch (e) {
      console.error(e);
      this.setState({ linkStatus: RequestStatus.Error });
    }
  };

  updateActionFieldValue = (actionKey, field, value) => {
    const actionFieldValues = Object.assign({}, this.state.actionFieldValues);
    actionFieldValues[actionKey] = Object.assign({}, actionFieldValues[actionKey], { [field.key]: value });
    this.setState({ actionFieldValues });
  };

  runAction = async action => {
    const actionStates = Object.assign({}, this.state.actionStates, {
      [action.key]: { status: RequestStatus.Getting }
    });
    this.setState({ actionStates });
    const rawValues = (this.state.actionFieldValues || {})[action.key] || {};
    const fields = {};
    (action.fields || []).forEach(field => {
      const value = rawValues[field.key];
      if (field.type === 'number') {
        const numericValue = value === '' || value === undefined || value === null ? NaN : Number(value);
        if (!Number.isNaN(numericValue)) {
          fields[field.key] = numericValue;
        }
      } else if (field.type === 'boolean') {
        fields[field.key] = !!value;
      } else if (value !== undefined && value !== null) {
        fields[field.key] = value;
      }
    });
    try {
      const result = await this.props.httpClient.post(
        `/api/v1/external_integration/${this.props.selector}/action/${action.key}`,
        { fields }
      );
      this.setState({
        actionStates: Object.assign({}, this.state.actionStates, {
          [action.key]: { status: RequestStatus.Success, message: result.message }
        })
      });
    } catch (e) {
      console.error(e);
      // an explicit refusal of the integration is a 422 carrying its message
      const message = get(e, 'response.data.properties');
      this.setState({
        actionStates: Object.assign({}, this.state.actionStates, {
          [action.key]: { status: RequestStatus.Error, message }
        })
      });
    }
  };

  connectOAuth = async field => {
    this.setState({ oauthStatus: RequestStatus.Getting });
    const { selector } = this.props;
    const redirectUri = `${window.location.origin}/dashboard/integration/device/external/${selector}/oauth-callback`;
    try {
      const { authorize_url: authorizeUrl } = await this.props.httpClient.post(
        `/api/v1/external_integration/${selector}/oauth/authorize_url`,
        {
          key: field.key,
          redirect_uri: redirectUri
        }
      );
      // the callback popup is a new tab: it recovers the oauth2 key
      // through localStorage (shared across same-origin tabs)
      localStorage.setItem(`externalIntegrationOAuthKey:${selector}`, field.key);
      window.open(authorizeUrl, '_blank', 'noopener');
      this.setState({ oauthStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ oauthStatus: RequestStatus.Error });
    }
  };

  executeAction = async action => {
    this.setState({ actionStatus: RequestStatus.Getting, actionError: null });
    try {
      const integration = await this.props.httpClient.post(
        `/api/v1/external_integration/${this.props.selector}/${action}`
      );
      this.setState({ integration, actionStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ actionStatus: RequestStatus.Error, actionError: action });
    }
  };

  askUninstall = () => {
    this.setState({ askingUninstall: true });
  };

  cancelUninstall = () => {
    this.setState({ askingUninstall: false });
  };

  uninstall = async () => {
    this.setState({ uninstallStatus: RequestStatus.Getting });
    try {
      await this.props.httpClient.delete(`/api/v1/external_integration/${this.props.selector}`);
      route('/dashboard/integration/device');
    } catch (e) {
      console.error(e);
      this.setState({ uninstallStatus: RequestStatus.Error });
    }
  };

  onStatusChanged = payload => {
    if (payload && this.state.integration && payload.selector === this.props.selector) {
      this.setState({
        integration: Object.assign({}, this.state.integration, { status: payload.status })
      });
    }
  };

  onConnectionStatusUpdated = payload => {
    if (payload && this.state.integration && payload.selector === this.props.selector) {
      this.setState({
        integration: Object.assign({}, this.state.integration, {
          connection_status: { connected: payload.connected, message: payload.message }
        })
      });
    }
  };

  componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.STATUS_CHANGED,
      this.onStatusChanged
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONNECTION_STATUS_UPDATED,
      this.onConnectionStatusUpdated
    );
    this.loadData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selector !== this.props.selector) {
      this.loadData();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.STATUS_CHANGED,
      this.onStatusChanged
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONNECTION_STATUS_UPDATED,
      this.onConnectionStatusUpdated
    );
  }

  render(props, state) {
    return (
      <ExternalIntegrationPage selector={props.selector} integration={state.integration}>
        <ConfigTab
          {...state}
          user={props.user}
          updateConfigValue={this.updateConfigValue}
          saveConfig={this.saveConfig}
          connectOAuth={this.connectOAuth}
          updateActionFieldValue={this.updateActionFieldValue}
          runAction={this.runAction}
          executeAction={this.executeAction}
          askUninstall={this.askUninstall}
          cancelUninstall={this.cancelUninstall}
          uninstall={this.uninstall}
          generateLinkCode={this.generateLinkCode}
          unlinkContact={this.unlinkContact}
        />
      </ExternalIntegrationPage>
    );
  }
}

export default connect('user,session,httpClient')(ExternalIntegrationConfigPage);
