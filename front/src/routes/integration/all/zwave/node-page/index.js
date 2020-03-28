import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwavePage from '../ZwavePage';
import NodeTab from './NodeTab';

@connect('session,user,zwaveDevices,houses,getZwaveDevicesStatus', actions)
class ZwaveNodePage extends Component {
  componentWillMount() {
    this.props.getZWaveDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <ZwavePage>
        <NodeTab {...props} />
      </ZwavePage>
    );
  }
}

export default ZwaveNodePage;
