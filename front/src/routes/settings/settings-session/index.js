import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SessionPage from './SessionsPage';
import actions from '../../../actions/session';

@connect(
  'user,sessions,sessionsGetStatus',
  actions
)
class SettingsSessions extends Component {
  componentWillMount() {
    this.props.getSessions();
  }

  render(props, {}) {
    return <SessionPage {...props} />;
  }
}

export default SettingsSessions;
