import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import EcovacsPage from '../EcovacsPage';
import DeviceTab from './DeviceTab';

class EcovacsIntegration extends Component {
  componentWillMount() {
    this.props.getEcovacsDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('ecovacs');
  }

  render(props, {}) {
    return (
      <EcovacsPage>
        <DeviceTab {...props} />
      </EcovacsPage>
    );
  }
}

export default connect('session,user,ecovacsDevices,houses,status', actions)(EcovacsIntegration);
