import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import LANManagerPage from '../LANManagerPage';
import LANManagerDeviceTab from './LANManagerDeviceTab';

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

export default connect(
  'session,httpClient,user,lanManagerDevices,houses,getLANManagerDevicesStatus',
  actions
)(LANManagerDevicePage);
