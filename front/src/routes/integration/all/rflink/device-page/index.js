import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import RflinkPage from '../RflinkPage';
import DevicePage from './DevicePage';
import integrationConfig from '../../../../../config/integrations';

@connect('session,user,rflinkDevices,houses,getRflinkDevicesStatus,currentIntegration', actions)
class RflinkDevicePage extends Component {
  componentWillMount() {
    this.props.getRflinkDevices(20, 0);
    this.props.getHouses();
  }

  

  render(props, {}) {
    return (
      <RflinkPage integration={integrationConfig[props.user.language].rflink}>
        <DevicePage {...props} />
      </RflinkPage>
    );
  }
}
console.log(this.props);

export default RflinkDevicePage;
