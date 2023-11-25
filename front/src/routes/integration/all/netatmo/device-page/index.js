import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import NetatmoPage from '../NetatmoPage';

class DevicePage extends Component {
  render(props, {}) {
    return (
      <NetatmoPage user={props.user}>
        <DeviceTab {...props} />
      </NetatmoPage>
    );
  }
}

export default connect('user', {})(DevicePage);
