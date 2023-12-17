import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import ZwaveJSUIPage from '../ZwaveJSUIPage';

class DevicePage extends Component {
  render(props, {}) {
    return (
      <ZwaveJSUIPage user={props.user}>
        <DeviceTab {...props} />
      </ZwaveJSUIPage>
    );
  }
}

export default connect('user', {})(DevicePage);
