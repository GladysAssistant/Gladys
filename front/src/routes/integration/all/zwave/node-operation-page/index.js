import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import actions from './actions';
import ZwavePage from '../ZwavePage';
import NodeOperationPage from './AddRemoveNode';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('session,user,zwaveDevices,houses,getZwaveDevicesStatus', actions)
class ZwaveNodeOperationPage extends Component {
  nodeAddedListener = () => {
    this.setState({
      nodeAdded: true
    });
  };
  nodeReadyListener = () => {
    if (this.props.action === 'add' || this.props.action === 'add-secure') {
      route('/dashboard/integration/device/zwave/setup');
    }
  };
  nodeRemovedListener = () => {
    if (this.props.action === 'remove') {
      route('/dashboard/integration/device/zwave/setup');
    }
  };
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
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_ADDED, this.nodeAddedListener);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_READY, this.nodeReadyListener);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_REMOVED, this.nodeRemovedListener);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_ADDED, this.nodeAddedListener);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_READY, this.nodeReadyListener);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_REMOVED, this.nodeRemovedListener);
  }

  render(props, { remainingTimeInSeconds, nodeAdded }) {
    return (
      <ZwavePage>
        <NodeOperationPage
          {...props}
          remainingTimeInSeconds={remainingTimeInSeconds}
          nodeAdded={nodeAdded}
          cancel={this.cancel}
        />
      </ZwavePage>
    );
  }
}

export default ZwaveNodeOperationPage;
