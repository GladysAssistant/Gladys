import { Component } from 'preact';
import { connect } from 'unistore/preact';
import NukiPage from './NukiPage';
import DeviceTab from './device-page/DeviceTab';

class NukiIntegration extends Component {
  render(props, {}) {
    return (
      <NukiPage user={props.user}>
        <DeviceTab {...props} />
      </NukiPage>
    );
  }
}

export default connect('user', {})(NukiIntegration);
