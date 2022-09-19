import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import EcovacsPage from '../EcovacsPage';
import SetupTab from './SetupTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,ecovacsUsername,ecovacsPassword,ecovacsCountryCode,connectEcovacsStatus,ecovacsConnected,ecovacsConnectionError',
  actions
)
class EcovacsSetupPage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('ecovacs');
    this.props.loadProps();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ECOVACS.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ECOVACS.ERROR, this.props.displayEcovacsError);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ECOVACS.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ECOVACS.ERROR, this.props.displayEcovacsError);
  }

  render(props, {}) {
    return (
      <EcovacsPage>
        <SetupTab {...props} />
      </EcovacsPage>
    );
  }
}

export default EcovacsSetupPage;
