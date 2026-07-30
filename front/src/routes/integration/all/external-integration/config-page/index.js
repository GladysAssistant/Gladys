import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';

import ExternalIntegrationPage from '../ExternalIntegrationPage';
import ConfigTab from './ConfigTab';
import { getRequestedHardwareClasses } from '../utils';
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
        grantedDevices: integration.granted_devices || [],
        loadStatus: RequestStatus.Success
      });
      if (get(integration, 'manifest.type') === 'communication') {
        // chat channels (receive true, the default) link by code;
        // send-only notification channels load the "My account" values
        if (get(integration, 'manifest.messaging.receive') !== false) {
          await this.loadContact();
        }
        if ((get(integration, 'manifest.contact_schema') || []).length > 0) {
          await this.loadContactProfile();
        }
      }
      await this.loadGatewayStatus(integration);
      await this.loadDynamicOptions(integration);
      await this.loadHardwareDetection(integration);
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

  loadContactProfile = async () => {
    try {
      const contactProfile = await this.props.httpClient.get(
        `/api/v1/external_integration/${this.props.selector}/contact_profile`
      );
      this.setState({
        contactProfile,
        contactProfileValues: Object.assign({}, contactProfile.values),
        contactProfileTouchedSecrets: {}
      });
    } catch (e) {
      console.error(e);
    }
  };

  updateContactProfileValue = (field, value) => {
    const contactProfileValues = Object.assign({}, this.state.contactProfileValues, { [field.key]: value });
    const newState = { contactProfileValues, contactProfileStatus: null };
    if (field.type === 'secret') {
      newState.contactProfileTouchedSecrets = Object.assign({}, this.state.contactProfileTouchedSecrets, {
        [field.key]: true
      });
    }
    this.setState(newState);
  };

  saveContactProfile = async e => {
    if (e) {
      e.preventDefault();
    }
    this.setState({ contactProfileStatus: RequestStatus.Getting });
    const { integration, contactProfileValues = {}, contactProfileTouchedSecrets = {} } = this.state;
    const contactSchema = get(integration, 'manifest.contact_schema') || [];
    const values = {};
    contactSchema.forEach(field => {
      const value = contactProfileValues[field.key];
      if (field.type === 'secret') {
        // a secret set to null means "unchanged" on the server side
        values[field.key] = contactProfileTouchedSecrets[field.key] ? value : null;
      } else if (field.type === 'number') {
        const numericValue = value === '' || value === undefined || value === null ? NaN : Number(value);
        if (!Number.isNaN(numericValue)) {
          values[field.key] = numericValue;
        }
      } else if (field.type === 'boolean') {
        values[field.key] = !!value;
      } else if (value !== undefined && value !== null) {
        values[field.key] = value;
      }
    });
    try {
      const contactProfile = await this.props.httpClient.post(
        `/api/v1/external_integration/${this.props.selector}/contact_profile`,
        { values }
      );
      this.setState({
        contactProfile,
        contactProfileValues: Object.assign({}, contactProfile.values),
        contactProfileTouchedSecrets: {},
        contactProfileStatus: RequestStatus.Success
      });
    } catch (err) {
      console.error(err);
      this.setState({ contactProfileStatus: RequestStatus.Error });
    }
  };

  clearContactProfile = async () => {
    this.setState({ contactProfileStatus: RequestStatus.Getting });
    try {
      await this.props.httpClient.delete(`/api/v1/external_integration/${this.props.selector}/contact_profile`);
      this.setState({ contactProfileStatus: null });
      await this.loadContactProfile();
    } catch (e) {
      console.error(e);
      this.setState({ contactProfileStatus: RequestStatus.Error });
    }
  };

  loadGatewayStatus = async integration => {
    // the webhooks block needs to know whether Gladys Plus is linked:
    // without it, an explanatory message replaces the key input
    if ((get(integration, 'manifest.webhooks') || []).length === 0) {
      return;
    }
    try {
      const gatewayStatus = await this.props.httpClient.get('/api/v1/gateway/status');
      this.setState({ gatewayStatus });
    } catch (e) {
      console.error(e);
    }
  };

  updateOpenApiKey = e => {
    this.setState({ openApiKeyValue: e.target.value, openApiKeyStatus: null });
  };

  saveOpenApiKey = async () => {
    this.setState({ openApiKeyStatus: RequestStatus.Getting });
    try {
      const configResponse = await this.props.httpClient.post(
        `/api/v1/external_integration/${this.props.selector}/config`,
        { config: { GLADYS_OPEN_API_KEY: this.state.openApiKeyValue } }
      );
      // the webhook URLs contain the key: refresh the detail to get them
      const integration = await this.props.httpClient.get(`/api/v1/external_integration/${this.props.selector}`);
      this.setState({
        integration,
        configuredSecrets: configResponse.configured_secrets || [],
        openApiKeyValue: '',
        openApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({ openApiKeyStatus: RequestStatus.Error });
    }
  };

  loadDynamicOptions = async integration => {
    // a select/multi_select of the config_schema (or of an action mini
    // form) can use the core-defined source "devices": its options are
    // the already-created devices of the integration (label = device
    // name, value = external_id), naturally scoped to its t_service
    const actionFields = (get(integration, 'manifest.actions') || []).reduce(
      (fields, action) => fields.concat(action.fields || []),
      []
    );
    const allFields = (get(integration, 'manifest.config_schema') || []).concat(actionFields);
    if (!allFields.some(field => field.source === 'devices')) {
      return;
    }
    try {
      const devices = await this.props.httpClient.get(`/api/v1/service/${this.props.selector}/device`);
      this.setState({
        dynamicOptions: {
          devices: devices.map(device => ({ value: device.external_id, label: device.name }))
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  loadHardwareDetection = async integration => {
    const requestedClasses = getRequestedHardwareClasses(get(integration, 'manifest.containers') || []);
    if (requestedClasses.length === 0) {
      return;
    }
    try {
      const { classes = [] } = await this.props.httpClient.get('/api/v1/external_integration/hardware');
      const detectedClasses = {};
      classes.forEach(hardwareClass => {
        detectedClasses[hardwareClass.class] = hardwareClass.detected;
      });
      this.setState({ detectedClasses });
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

  toggleHardwareClass = hardwareClass => {
    const { grantedDevices = [] } = this.state;
    this.setState({
      grantedDevices: grantedDevices.includes(hardwareClass)
        ? grantedDevices.filter(grantedClass => grantedClass !== hardwareClass)
        : grantedDevices.concat([hardwareClass]),
      hardwareStatus: null
    });
  };

  saveHardware = async () => {
    this.setState({ hardwareStatus: RequestStatus.Getting });
    try {
      const integration = await this.props.httpClient.post(
        `/api/v1/external_integration/${this.props.selector}/hardware`,
        { granted_devices: this.state.grantedDevices || [] }
      );
      this.setState({
        integration,
        grantedDevices: integration.granted_devices || [],
        hardwareStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({ hardwareStatus: RequestStatus.Error });
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

  togglePreferLocal = async e => {
    const preferLocal = e.target.checked;
    // optimistic update, saved immediately (standard core toggle, outside
    // the manifest config_schema)
    this.setState({
      configValues: Object.assign({}, this.state.configValues, { GLADYS_PREFER_LOCAL: preferLocal }),
      preferLocalStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post(`/api/v1/external_integration/${this.props.selector}/config`, {
        config: { GLADYS_PREFER_LOCAL: preferLocal }
      });
      this.setState({ preferLocalStatus: RequestStatus.Success });
    } catch (err) {
      console.error(err);
      this.setState({
        configValues: Object.assign({}, this.state.configValues, { GLADYS_PREFER_LOCAL: !preferLocal }),
        preferLocalStatus: RequestStatus.Error
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
          httpClient={props.httpClient}
          updateConfigValue={this.updateConfigValue}
          saveConfig={this.saveConfig}
          connectOAuth={this.connectOAuth}
          togglePreferLocal={this.togglePreferLocal}
          updateActionFieldValue={this.updateActionFieldValue}
          runAction={this.runAction}
          generateLinkCode={this.generateLinkCode}
          unlinkContact={this.unlinkContact}
          updateOpenApiKey={this.updateOpenApiKey}
          saveOpenApiKey={this.saveOpenApiKey}
          updateContactProfileValue={this.updateContactProfileValue}
          saveContactProfile={this.saveContactProfile}
          clearContactProfile={this.clearContactProfile}
          toggleHardwareClass={this.toggleHardwareClass}
          saveHardware={this.saveHardware}
        />
      </ExternalIntegrationPage>
    );
  }
}

export default connect('user,session,httpClient')(ExternalIntegrationConfigPage);
