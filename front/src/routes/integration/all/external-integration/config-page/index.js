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
    try {
      const [integration, configResponse] = await Promise.all([
        this.props.httpClient.get(`/api/v1/external_integration/${this.props.selector}`),
        this.props.httpClient.get(`/api/v1/external_integration/${this.props.selector}/config`)
      ]);
      const configValues = this.buildConfigValues(integration, configResponse);
      this.setState({
        integration,
        configValues,
        configuredSecrets: configResponse.configured_secrets || [],
        touchedSecrets: {},
        loadStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({ loadStatus: RequestStatus.Error });
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
        config[field.key] = value === '' || value === undefined || value === null ? null : Number(value);
      } else if (field.type === 'boolean') {
        config[field.key] = !!value;
      } else {
        config[field.key] = value === undefined ? null : value;
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

  getLogs = async () => {
    this.setState({ logsStatus: RequestStatus.Getting });
    try {
      const { logs } = await this.props.httpClient.get(`/api/v1/external_integration/${this.props.selector}/logs`, {
        lines: 200
      });
      this.setState({ logs, logsStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ logsStatus: RequestStatus.Error });
    }
  };

  openLogs = () => {
    this.setState({ showLogsModal: true, logs: null });
    this.getLogs();
  };

  closeLogs = () => {
    this.setState({ showLogsModal: false });
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

  componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.STATUS_CHANGED,
      this.onStatusChanged
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
  }

  render(props, state) {
    return (
      <ExternalIntegrationPage selector={props.selector} integration={state.integration}>
        <ConfigTab
          {...state}
          user={props.user}
          updateConfigValue={this.updateConfigValue}
          saveConfig={this.saveConfig}
          executeAction={this.executeAction}
          openLogs={this.openLogs}
          closeLogs={this.closeLogs}
          getLogs={this.getLogs}
          askUninstall={this.askUninstall}
          cancelUninstall={this.cancelUninstall}
          uninstall={this.uninstall}
        />
      </ExternalIntegrationPage>
    );
  }
}

export default connect('user,session,httpClient')(ExternalIntegrationConfigPage);
