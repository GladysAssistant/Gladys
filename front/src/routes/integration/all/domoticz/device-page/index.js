import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import DomoticzPage from '../DomoticzPage';
import DeviceTab from './DeviceTab';

@connect('session,user,domoticzDevices,houses,getDomoticzDevicesStatus', actions)
class DomoticzDevicePage extends Component {
  componentWillMount() {
    console.log('componentWillMount');
    this.props.getDomoticzDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <DomoticzPage>
        <DeviceTab {...props} />
      </DomoticzPage>
    );
  }
}

export default DomoticzDevicePage;
