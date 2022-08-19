import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zwavejs2mqttPage from '../Zwavejs2mqttPage';
import NodeTab from './NodeTab';

@connect('session,user,zwaveDevices,houses,getZwaveDevicesStatus', actions)
class Zwavejs2mqttNodePage extends Component {
  componentWillMount() {
    this.props.getZWaveDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <Zwavejs2mqttPage>
        <NodeTab {...props} />
      </Zwavejs2mqttPage>
    );
  }
}

export default Zwavejs2mqttNodePage;
