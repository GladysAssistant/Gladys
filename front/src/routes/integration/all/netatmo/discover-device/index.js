import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import NetatmoPage from '../NetatmoPage';
import FoundDevices from './FoundDevices';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'session,user,houses,netatmoSensors,connectNetatmoStatus,getNetatmoNewDevicesStatus,getNetatmoDevicesStatus',
  actions
)
class NetatmoDiscoveryPage extends Component {
  async componentWillMount() {
    this.props.loadProps();
    this.props.getNetatmoDeviceSensors();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.NEW_DEVICE,
      this.props.getNetatmoDeviceSensors
    );
  }
  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.NEW_DEVICE,
      this.props.getNetatmoDeviceSensors
    );
  }

  render(props) {
    return (
      <NetatmoPage>
        <FoundDevices {...props} />
      </NetatmoPage>
    );
  }
}

export default NetatmoDiscoveryPage;
