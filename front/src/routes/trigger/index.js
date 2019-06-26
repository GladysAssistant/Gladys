import { Component } from 'preact';
import { connect } from 'unistore/preact';
import TriggerPage from './TriggerPage';
import actions from '../../actions/device';

@connect(
  '',
  actions
)
class Trigger extends Component {
  componentWillMount() {}

  render({}, {}) {
    return <TriggerPage />;
  }
}

export default Trigger;
