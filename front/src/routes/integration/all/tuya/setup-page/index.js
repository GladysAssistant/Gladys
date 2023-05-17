import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import SetupTab from './SetupTab';
import TuyaPage from '../TuyaPage';

class TuyaSetupPage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('tuya');
    this.props.getTuyaConfiguration();
    /*
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR, this.props.displayEweLinkError);
     */
  }

  componentWillUnmount() {
    /*
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR, this.props.displayEweLinkError);
     */
  }

  render(props, {}) {
    return (
      <TuyaPage>
        <SetupTab {...props} />
      </TuyaPage>
    );
  }
}

export default connect(
  'user,session,currentIntegration,tuyaEndpoint,tuyaAccessKey,tuyaSecretKey,tuyaGetSettingsStatus,tuyaSaveSettingsStatus',
  actions
)(TuyaSetupPage);
