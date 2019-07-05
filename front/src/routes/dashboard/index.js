import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DashboardPage from './DashboardPage';
import actions from '../../actions/dashboard';

@connect(
  'user,dashboardEditMode,dashboardNotConfigured,editDashboardDragEnable,homeDashboard,gatewayInstanceNotFound',
  actions
)
class Dashboard extends Component {
  componentWillMount() {
    this.props.getBoxes();
  }

  render(props, {}) {
    return <DashboardPage {...props} />;
  }
}

export default Dashboard;
