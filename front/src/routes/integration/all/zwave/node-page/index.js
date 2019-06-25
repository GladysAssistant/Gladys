import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwavePage from '../ZwavePage';
import NodeTab from './NodeTab';
import integrationConfig from '../../../../../config/integrations';

@connect(
  'session,user,zwaveDevices,houses,getZwaveDevicesStatus',
  actions
)
class ZwaveNodePage extends Component {
  componentWillMount() {
    this.props.getZWaveDevices(20, 0);
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <ZwavePage integration={integrationConfig[props.user.language].zwave}>
        <NodeTab {...props} />
      </ZwavePage>
    );
  }
}

export default ZwaveNodePage;
