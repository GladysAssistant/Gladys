import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import SunSpecPage from '../SunSpecPage';
import SunSpecDeviceTab from './SunSpecDeviceTab';

class SunSpecDevicePage extends Component {
  componentWillMount() {
    this.props.getSunSpecDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <SunSpecPage>
        <SunSpecDeviceTab {...props} />
      </SunSpecPage>
    );
  }
}

export default connect(
  'session,httpClient,user,sunspecDevices,houses,getSunSpecDevicesStatus',
  actions
)(SunSpecDevicePage);
