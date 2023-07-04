import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import TuyaPage from '../TuyaPage';

class DevicePage extends Component {
  render(props, {}) {
    return (
      <TuyaPage user={props.user}>
        <DeviceTab {...props} />
      </TuyaPage>
    );
  }
}

export default connect('user', {})(DevicePage);
