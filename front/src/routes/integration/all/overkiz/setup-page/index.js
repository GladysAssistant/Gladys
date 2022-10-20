import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import OverkizPage from '../OverkizPage';
import SetupTab from './SetupTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,overkizUsername,overkizPassword,connectOverkizStatus,overkizConnected,overkizConnectionError',
  actions
)
class OverkizSetupPage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('overkiz');
    this.props.loadProps();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.OVERKIZ.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.OVERKIZ.ERROR, this.props.displayOverkizError);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.OVERKIZ.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.OVERKIZ.ERROR, this.props.displayOverkizError);
  }

  render(props, {}) {
    return (
      <OverkizPage>
        <SetupTab {...props} />
      </OverkizPage>
    );
  }
}

export default OverkizSetupPage;
