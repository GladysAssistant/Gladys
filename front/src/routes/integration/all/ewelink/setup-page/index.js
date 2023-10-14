import { Component } from 'preact';
import { connect } from 'unistore/preact';

import EweLinkPage from '../EweLinkPage';
import SetupTab from './SetupTab';
import { DEFAULT_REGION } from './constants';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../../utils/consts';

class EweLinkSetupPage extends Component {
  loadEwelinkStatus = async () => {
    this.setState({
      loadEwelinkStatus: RequestStatus.Getting
    });
    try {
      const { configured, connected } = await this.props.httpClient.get('/api/v1/service/ewelink/status');
      const ewelinkStatus = { configured, connected };
      this.setState({
        ewelinkStatus,
        loadEwelinkStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error('eWeLink error loading status', e);
      this.setState({
        loadEwelinkStatus: RequestStatus.Error
      });
    }
  };

  loadEwelinkConfig = async () => {
    this.setState({
      loadEwelinkConfig: RequestStatus.Getting
    });
    try {
      const {
        application_id: applicationId,
        application_secret: applicationSecret,
        application_region: applicationRegion = DEFAULT_REGION
      } = await this.props.httpClient.get('/api/v1/service/ewelink/config');
      this.setState({
        ewelinkConfig: { applicationId, applicationSecret, applicationRegion },
        loadEwelinkConfig: RequestStatus.Success
      });
    } catch (e) {
      console.error('eWeLink error loading config', e);
      this.setState({
        loadEwelinkConfig: RequestStatus.Error
      });
    }
  };

  saveEwelinkConfig = async config => {
    this.setState({
      saveEwelinkConfig: RequestStatus.Getting
    });
    try {
      const { applicationId, applicationSecret, applicationRegion } = config;
      const savedConfig = await this.props.httpClient.post('/api/v1/service/ewelink/config', {
        application_id: applicationId,
        application_secret: applicationSecret,
        application_region: applicationRegion
      });
      const ewelinkConfig = {
        applicationId: savedConfig.application_id,
        applicationSecret: savedConfig.application_secret,
        applicationRegion: savedConfig.application_secret
      };
      this.setState({
        ewelinkConfig,
        saveEwelinkConfig: RequestStatus.Success
      });
    } catch (e) {
      console.error('eWeLink error saving config', e);
      this.setState({
        saveEwelinkConfig: RequestStatus.Error
      });
    }
  };

  connectUser = async () => {
    this.setState({ loadConnectUser: RequestStatus.Getting });

    const { origin, pathname } = window.location;
    try {
      const { login_url: loginUrl } = await this.props.httpClient.get('/api/v1/service/ewelink/loginUrl', {
        redirect_url: `${origin}${pathname}/login`
      });
      const loginPopup = window.open(loginUrl, 'ewelinkLogin');
      this.setState({ loadConnectUser: RequestStatus.Success, loginPopup });
    } catch (e) {
      console.error(e);
      this.setState({ loadConnectUser: RequestStatus.Error });
    }
  };

  disconnectUser = async () => {
    this.setState({ loadDisconnectUser: RequestStatus.Getting });

    try {
      await this.props.httpClient.delete('/api/v1/service/ewelink/token');
      this.setState({ loadDisconnectUser: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ loadDisconnectUser: RequestStatus.Error });
    }
  };

  updateStatus = payload => {
    const { configured, connected } = payload;
    const ewelinkStatus = { configured, connected };

    const { loginPopup, ewelinkStatus: currentStatus = {} } = this.state;
    if (!currentStatus.connected && connected && loginPopup && !loginPopup.closed) {
      loginPopup.close();
    }

    this.setState({ ewelinkStatus });
  };

  constructor(props) {
    super(props);

    this.state = {
      loadEwelinkStatus: RequestStatus.Getting
    };
  }

  componentDidMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS, this.updateStatus);
    this.loadEwelinkStatus();
    this.loadEwelinkConfig();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS, this.updateStatus);
  }

  render(
    {},
    {
      loadEwelinkStatus,
      ewelinkStatus,
      loadEwelinkConfig,
      ewelinkConfig,
      saveEwelinkConfig,
      loadDisconnectUser,
      loadConnectUser
    }
  ) {
    return (
      <EweLinkPage>
        <SetupTab
          ewelinkStatus={ewelinkStatus}
          loadEwelinkStatus={loadEwelinkStatus}
          ewelinkConfig={ewelinkConfig}
          loadEwelinkConfig={loadEwelinkConfig}
          saveEwelinkConfig={saveEwelinkConfig}
          saveConfiguration={this.saveEwelinkConfig}
          connectUser={this.connectUser}
          loadConnectUser={loadConnectUser}
          disconnectUser={this.disconnectUser}
          loadDisconnectUser={loadDisconnectUser}
        />
      </EweLinkPage>
    );
  }
}

export default connect('user,session,httpClient')(EweLinkSetupPage);
