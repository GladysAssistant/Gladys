import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import { Text } from 'preact-i18n';

import ExternalIntegrationPage from '../ExternalIntegrationPage';
import SupervisionCard from './SupervisionCard';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import style from './style.css';

class ExternalIntegrationSupervisionPage extends Component {
  loadData = async () => {
    this.setState({ loadStatus: RequestStatus.Getting });
    const { selector } = this.props;
    try {
      const integration = await this.props.httpClient.get(`/api/v1/external_integration/${selector}`);
      if (selector !== this.props.selector) {
        // a newer request has started since, discard this stale result
        return;
      }
      this.setState({ integration, loadStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      if (selector !== this.props.selector) {
        return;
      }
      this.setState({ integration: null, loadStatus: RequestStatus.Error });
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
    const language = (props.user && props.user.language) || 'en';
    return (
      <ExternalIntegrationPage selector={props.selector} integration={state.integration}>
        {state.loadStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.externalIntegration.supervision.loadError" />
          </div>
        )}
        {state.integration ? (
          <SupervisionCard
            integration={state.integration}
            language={language}
            actionStatus={state.actionStatus}
            actionError={state.actionError}
            uninstallStatus={state.uninstallStatus}
            askingUninstall={state.askingUninstall}
            executeAction={this.executeAction}
            onAskUninstall={this.askUninstall}
            onCancelUninstall={this.cancelUninstall}
            onUninstall={this.uninstall}
          />
        ) : (
          state.loadStatus === RequestStatus.Getting && (
            <div class="card">
              <div class="card-body">
                <div class="dimmer active">
                  <div class="loader" />
                  <div class={`dimmer-content ${style.loadingPlaceholder}`} />
                </div>
              </div>
            </div>
          )
        )}
      </ExternalIntegrationPage>
    );
  }
}

export default connect('user,session,httpClient')(ExternalIntegrationSupervisionPage);
