import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import HeatzyPage from '../HeatzyPage';
import SetupTab from './SetupTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,heatzyLogin,heatzyPassword,connectHeatzyStatus,heatzyConnected,heatzyConnectionError', actions)
class HeatzyNodePage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('heatzy');
    this.props.loadProps();
  this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.HEATZY.CONNECTED, () =>
      this.props.displayConnectedMessage()
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.HEATZY.ERROR, payload =>
      this.props.displayHeatzyError(payload)
    );
  }

  render(props, {}) {
    return (
      <HeatzyPage>
        <SetupTab {...props} />
      </HeatzyPage>
    );
  }
}

export default HeatzyNodePage;
