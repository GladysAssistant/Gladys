import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zwavejs2mqttPage from '../Zwavejs2mqttPage';
import NetworkTab from './NetworkTab';

@connect('user,zwaveNodesNeighbors,zwaveGetNeighborsStatus', actions)
class Zwavejs2mqttNodePage extends Component {
  componentWillMount() {}

  componentDidMount() {
    this.props.getNeighbors();
  }

  render(props, {}) {
    return (
      <Zwavejs2mqttPage>
        <NetworkTab {...props} />
      </Zwavejs2mqttPage>
    );
  }
}

export default Zwavejs2mqttNodePage;
