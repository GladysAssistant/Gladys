import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import actions from './actions';
import Zwavejs2mqttPage from '../Zwavejs2mqttPage';
import NodeOperationPage from './AddRemoveNode';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('session,user,zwaveDevices,houses,getZwaveDevicesStatus', actions)
class Zwavejs2mqttNodeOperationPage extends Component {
  nodeAddedListener = () => {
    this.setState({
      nodeAdded: true
    });
  };
  nodeReadyListener = () => {
    if (this.props.action === 'add' || this.props.action === 'add-secure') {
      route('/dashboard/integration/device/zwavejs2mqtt/discover');
    }
  };
  nodeRemovedListener = () => {
    if (this.props.action === 'remove') {
      route('/dashboard/integration/device/zwavejs2mqtt/discover');
    }
  };
  decrementTimer = () => {
    this.setState(prevState => {
      return { remainingTimeInSeconds: prevState.remainingTimeInSeconds - 1 };
    });
    if (this.state.remainingTimeInSeconds > 1) {
      setTimeout(this.decrementTimer, 1000);
    } else {
      route('/dashboard/integration/device/zwavejs2mqtt/discover');
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
    route('/dashboard/integration/device/zwavejs2mqtt/discover');
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
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.NODE_ADDED, this.nodeAddedListener);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.NODE_READY, this.nodeReadyListener);
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.NODE_REMOVED,
      this.nodeRemovedListener
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.NODE_ADDED,
      this.nodeAddedListener
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.NODE_READY,
      this.nodeReadyListener
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.NODE_REMOVED,
      this.nodeRemovedListener
    );
  }

  render(props, { remainingTimeInSeconds, nodeAdded }) {
    return (
      <Zwavejs2mqttPage>
        <NodeOperationPage
          {...props}
          remainingTimeInSeconds={remainingTimeInSeconds}
          nodeAdded={nodeAdded}
          cancel={this.cancel}
        />
      </Zwavejs2mqttPage>
    );
  }
}

export default Zwavejs2mqttNodeOperationPage;
