import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwaveJSUIPage from '../ZwaveJSUIPage';
import NodeTab from './NodeTab';

@connect('session,user,zwaveDevices,houses,getZwaveDevicesStatus', actions)
class ZwaveJSUINodePage extends Component {
  componentWillMount() {
    this.props.getZWaveDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <ZwaveJSUIPage>
        <NodeTab {...props} />
      </ZwaveJSUIPage>
    );
  }
}

export default ZwaveJSUINodePage;
