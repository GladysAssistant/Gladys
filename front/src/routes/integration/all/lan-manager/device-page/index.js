import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import LANManagerPage from '../LANManagerPage';
import LANManagerDeviceTab from './LANManagerDeviceTab';

@connect('session,user,lanManagerDevices,houses,getLANManagerDevicesStatus', actions)
class LANManagerDevicePage extends Component {
  componentWillMount() {
    this.props.getLANManagerDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <LANManagerPage>
        <LANManagerDeviceTab {...props} />
      </LANManagerPage>
    );
  }
}

export default LANManagerDevicePage;
