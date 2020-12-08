import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import NetatmoPage from '../NetatmoPage';
import DeviceTab from './DeviceTab';
import FoundDevices from './FoundDevices';

@connect('session,user,houses,netatmoSensors,netatmoDevices,getNetatmoNewDevicesStatus,getNetatmoDevicesStatus', actions)
class NetatmoDevicePage extends Component {
  componentWillMount() {
    this.props.getNetatmoSensors();
    this.props.getHouses();
    this.props.getNetatmoDevices();
    this.props.getIntegrationByName('netatmo');
  }

  render(props, {}) {
    return (
      <NetatmoPage>
        {props.netatmoDevices && props.netatmoDevices.length ? <DevicePage {...props} /> : <div />}
        <FoundDevices {...props} />
      </NetatmoPage>
    );
  }
}

export default NetatmoDevicePage;
