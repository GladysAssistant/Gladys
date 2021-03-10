import { Component } from 'preact';
import { connect } from 'unistore/preact';

import actions from './actions';
import AwoxPage from '../AwoxPage';
import AwoxDeviceTab from './AwoxDeviceTab';

@connect('user,session,houses,awoxDevices,getAwoxDevicesStatus', actions)
class AwoxDevicePage extends Component {
  componentWillMount() {
    this.props.getAwoxDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <AwoxPage user={props.user}>
        <AwoxDeviceTab {...props} />
      </AwoxPage>
    );
  }
}

export default AwoxDevicePage;
