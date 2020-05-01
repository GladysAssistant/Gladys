import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import RflinkPage from '../RflinkPage';
import DevicePage from './DevicePage';
import integrationConfig from '../../../../../config/integrations';
import FoundDevices from './FoundDevices';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'session,user,rflinkDevices,houses,getRflinkDevicesStatus,currentIntegration,rflinkNewDevices,getRflinkCreateDeviceStatus,getRflinkNewDevicesStatus',
  actions
)
class RflinkDevicePage extends Component {
  componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.RFLINK.NEW_DEVICE , () => {
      this.props.getRflinkNewDevices();
    });
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
