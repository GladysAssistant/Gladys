import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import NetatmoPage from '../NetatmoPage';
import DeviceTab from './DeviceTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'session,user,houses,netatmoSensors,netatmoDevices,netatmoConnectStatus,getNetatmoNewDevicesStatus,getNetatmoDevicesStatus',
  actions
)
class NetatmoDevicePage extends Component {
  componentWillMount() {
    this.props.getHouses();
    this.props.getNetatmoSensors();
    this.props.getNetatmoDevices();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.NEW_DEVICE, this.props.getNetatmoSensors);
  }
  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.NEW_DEVICE,
      this.props.getNetatmoSensors
    );
  }

  render(props, {}) {
    return (
      <NetatmoPage>
        <DeviceTab {...props} />
      </NetatmoPage>
    );
  }
}

export default NetatmoDevicePage;
