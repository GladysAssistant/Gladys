import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import NetatmoPage from '../NetatmoPage';
import DeviceTab from './DeviceTab';
import FoundDevices from './FoundDevices';
import integrationConfig from '../../../../../config/integrations';

@connect('session,user,houses,netatmoDevices,netatmoNewDevices,getNetatmoNewDevicesStatus,getNetatmoDevicesStatus', actions)
class NetatmoDevicePage extends Component {
  componentWillMount() {
    this.props.getNetatmoDevices();
    this.props.getHouses();
    this.props.getNetatmoNewDevices();
    this.props.getIntegrationByName('netatmo');
  }

  render(props, {}) {
    return (
      <NetatmoPage integration={integrationConfig[props.user.language].netatmo}>
        {props.netatmoDevices && props.netatmoDevices.length ? <DevicePage {...props} /> : <div />}
        <FoundDevices {...props} />
      </NetatmoPage>
    );
  }
}

export default NetatmoDevicePage;
