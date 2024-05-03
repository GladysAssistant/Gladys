import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import PhilipsHuePage from '../PhilipsHuePage';
import { RequestStatus } from '../../../../../utils/consts';
import SetupTab from './SetupTab';

class PhilipsHueSetupPage extends Component {
  syncWithBridge = async () => {
    try {
      this.setState({ syncWithBridgeError: null, loading: true });
      await this.props.httpClient.post('/api/v1/service/philips-hue/bridge/sync');
      this.setState({ loading: false });
    } catch (e) {
      console.error(e);
      this.setState({ syncWithBridgeError: e.toString(), loading: false });
    }
  };
  componentWillMount() {
    // this.props.getIntegrationByName('philips-hue');
    this.props.getBridges();
    this.props.getPhilipsHueDevices();
  }

  render(props, { syncWithBridgeError, loading }) {
    const combinedLoading = props.philipsHueGetDevicesStatus === RequestStatus.Getting || loading;
    return (
      <PhilipsHuePage user={props.user}>
        <SetupTab
          {...props}
          syncWithBridge={this.syncWithBridge}
          syncWithBridgeError={syncWithBridgeError}
          loading={combinedLoading}
        />
      </PhilipsHuePage>
    );
  }
}

export default connect(
  'user,httpClient,philipsHueBridges,philipsHueBridgesDevices,philipsHueGetDevicesStatus,philipsHueCreateDeviceStatus,philipsHueGetBridgesStatus,philipsHueDeleteDeviceStatus',
  actions
)(PhilipsHueSetupPage);
