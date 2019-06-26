import { Component } from 'preact';
import { connect } from 'unistore/preact';
import EditTriggerPage from './EditTriggerPage';
import actions from '../../../actions/device';

@connect(
  '',
  actions
)
class EditTrigger extends Component {
  componentWillMount() {}

  render({}, {}) {
    return <EditTriggerPage />;
  }
}

export default EditTrigger;
