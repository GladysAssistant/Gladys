import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DashboardPage from './DashboardPage';
import actions from '../../actions/dashboard';

@connect(
  '',
  actions
)
class Dashboard extends Component {
  componentWillMount() {
    this.props.getBoxes();
  }

  render({}, {}) {
    return <DashboardPage />;
  }
}

export default Dashboard;
