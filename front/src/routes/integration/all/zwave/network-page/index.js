import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwavePage from '../ZwavePage';
import NetworkTab from './NetworkTab';

@connect('user,zwaveNodesNeighbors,zwaveGetNeighborsStatus', actions)
class ZwaveNodePage extends Component {
  componentWillMount() {}

  componentDidMount() {
    this.props.getNeighbors();
  }

  render(props, {}) {
    return (
      <ZwavePage>
        <NetworkTab {...props} />
      </ZwavePage>
    );
  }
}

export default ZwaveNodePage;
