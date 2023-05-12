import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DevicePage from './DevicePage';
import actions from '../../actions/device';

class Device extends Component {
  componentWillMount() {
    this.props.getDevicesByRoom();
  }

  render({}, {}) {
    return <DevicePage />;
  }
}

export default connect('', actions)(Device);
