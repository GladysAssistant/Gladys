import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MiLightPage from '../MiLightPage';
import SetupTab from './SetupTab';

@connect(
  'user,miLightBridges,miLightBridgesDevices,miLightGetDevicesStatus,miLightCreateDeviceStatus,miLightGetBridgesStatus,miLightDeleteDeviceStatus',
  actions
)
class MiLightSetupPage extends Component {
  componentWillMount() {
    this.props.getBridges();
    this.props.getMiLightDevices();
  }

  render(props, {}) {
    return (
      <MiLightPage>
        <SetupTab {...props} />
      </MiLightPage>
    );
  }
}

export default MiLightSetupPage;
