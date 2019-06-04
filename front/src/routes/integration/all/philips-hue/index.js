import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import PhilipsHuePage from './PhilipsHue';
import integrationConfig from '../../../../config/integrations';

@connect(
  'user,philipsHueGetBridgesStatus,philipsHueGetBridgeError,bridges',
  actions
)
class PhilipsHueIntegration extends Component {
  updateBridgeName = e => {
    this.props.updateBridgeName('firstname', e.target.value);
  };
  render(
    {
      user,
      getBridges,
      discoverBridge,
      configureBridge,
      bridges,
      philipsHueGetBridgesStatus,
      philipsHueGetBridgeError
    },
    {}
  ) {
    return (
      <PhilipsHuePage
        integration={integrationConfig[user.language]['philips-hue']}
        getBridges={getBridges}
        discoverBridge={discoverBridge}
        configureBridge={configureBridge}
        updateBridgeName={this.updateBridgeName}
        philipsHueGetBridgesStatus={philipsHueGetBridgesStatus}
        philipsHueGetBridgeError={philipsHueGetBridgeError}
        bridges={bridges}
      />
    );
  }
}

export default PhilipsHueIntegration;
