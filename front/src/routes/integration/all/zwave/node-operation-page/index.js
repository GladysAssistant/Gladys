import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import actions from './actions';
import ZwavePage from '../ZwavePage';
import NodeOperationPage from './AddRemoveNode';

@connect('session,user,zwaveDevices,houses,getZwaveDevicesStatus', actions)
class ZwaveNodeOperationPage extends Component {
  decrementTimer = () => {
    this.setState(prevState => {
      return { remainingTimeInSeconds: prevState.remainingTimeInSeconds - 1 };
    });
    if (this.state.remainingTimeInSeconds > 1) {
      setTimeout(this.decrementTimer, 1000);
    } else {
      route('/dashboard/integration/device/zwave/setup');
    }
  };
  addNode = () => {
    this.props.addNode();
    setTimeout(this.decrementTimer, 1000);
  };
  addNodeSecure = () => {
    this.props.addNodeSecure();
    setTimeout(this.decrementTimer, 1000);
  };
  removeNode = () => {
    this.props.removeNode();
    setTimeout(this.decrementTimer, 1000);
  };
  cancel = () => {
    this.props.cancelZwaveCommand();
    route('/dashboard/integration/device/zwave/setup');
  };
  constructor(props) {
    super(props);
    this.state = {
      remainingTimeInSeconds: 60
    };
  }
  componentWillMount() {
    switch (this.props.action) {
      case 'add':
        this.addNode();
        break;
      case 'add-secure':
        this.addNodeSecure();
        break;
      case 'remove':
        this.removeNode();
        break;
    }
  }

  render(props, { remainingTimeInSeconds }) {
    return (
      <ZwavePage>
        <NodeOperationPage {...props} remainingTimeInSeconds={remainingTimeInSeconds} cancel={this.cancel} />
      </ZwavePage>
    );
  }
}

export default ZwaveNodeOperationPage;
