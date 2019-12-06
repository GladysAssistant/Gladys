import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import NetatmoPage from '../NetatmoPage';
import DeviceTab from './DeviceTab';
import integrationConfig from '../../../../../config/integrations';

@connect('session,user', actions)
class NetatmoDevicePage extends Component {
  componentWillMount() {
    this.props.getHouses();
    this.props.getIntegrationByName('netatmo');
  }

  render(props, {}) {
    return (
      <NetatmoPage integration={integrationConfig[props.user.language].netatmo}>
        <DeviceTab {...props} />
      </NetatmoPage>
    );
  }
}

export default NetatmoDevicePage;
