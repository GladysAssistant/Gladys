import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import MELCloudPage from '../MELCloudPage';

class DevicePage extends Component {
  render(props, {}) {
    return (
      <MELCloudPage user={props.user}>
        <DeviceTab {...props} />
      </MELCloudPage>
    );
  }
}

export default connect('user', {})(DevicePage);
