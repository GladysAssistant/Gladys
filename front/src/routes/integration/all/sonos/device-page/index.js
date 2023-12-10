import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import SonosPage from '../SonosPage';

class DevicePage extends Component {
  render(props, {}) {
    return (
      <SonosPage user={props.user}>
        <DeviceTab {...props} />
      </SonosPage>
    );
  }
}

export default connect('user', {})(DevicePage);
