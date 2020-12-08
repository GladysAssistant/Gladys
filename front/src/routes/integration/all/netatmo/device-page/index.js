import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import NetatmoPage from '../NetatmoPage';
import DeviceTab from './DeviceTab';
import FoundDevices from './FoundDevices';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('session,user,houses,netatmoSensors,netatmoDevices,getNetatmoNewDevicesStatus,getNetatmoDevicesStatus', actions)
class NetatmoDevicePage extends Component {
  componentWillMount() {
    this.props.getHouses();
    this.props.getNetatmoSensors();
    this.props.getNetatmoDevices();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.NEW_DEVICE, payload => {
      this.props.getNetatmoSensors();
    });
  }

  render(props, {}) {
    return (
      <NetatmoPage>
        {props.netatmoDevices && props.netatmoDevices.length ? <DeviceTab {...props} /> : <div />}
        <FoundDevices {...props} />
      </NetatmoPage>
    );
  }
}

export default NetatmoDevicePage;
