import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwavePage from '../ZwavePage';
import NodeTab from './NodeTab';

class ZwaveNodePage extends Component {
  componentWillMount() {
    this.props.getZWaveDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <ZwavePage user={props.user}>
        <NodeTab {...props} />
      </ZwavePage>
    );
  }
}

export default connect(
  'session,user,zwaveDevices,houses,getZwaveDevicesStatus,getZwaveDeviceOrderDir,zwaveDeviceSearch',
  actions
)(ZwaveNodePage);
