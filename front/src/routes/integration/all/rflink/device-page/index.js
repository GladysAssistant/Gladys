import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import RflinkPage from '../RflinkPage';
import DevicePage from './DevicePage';
import integrationConfig from '../../../../../config/integrations';
import FoundDevices from './FoundDevices';

@connect(
  'session,user,rflinkDevices,houses,getRflinkDevicesStatus,currentIntegration,rflinkNewDevices,getRflinkCreateDeviceStatus,getRflinkNewDevicesStatus',
  actions
)
class RflinkDevicePage extends Component {
  componentWillMount() {
    this.props.getRflinkDevices(20, 0);
    this.props.getRflinkNewDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('rflink');
  }

  render(props, {}) {
    return (
      <RflinkPage>
        <DevicePage {...props} />
        <FoundDevices {...props} />
      </RflinkPage>
    );
  }
}

export default RflinkDevicePage;
