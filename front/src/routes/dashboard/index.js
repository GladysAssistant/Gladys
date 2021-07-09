import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import update, { extend } from 'immutability-helper';
import DashboardPage from './DashboardPage';
import actions from '../../actions/dashboard';
import { RequestStatus } from '../../utils/consts';
import get from 'get-value';
import { DASHBOARD_TYPE } from '../../../../server/utils/constants';

extend('$auto', function(value, object) {
  return object ? update(object, value) : update({}, value);
});

@connect('user,fullScreen,currentUrl,httpClient', actions)
class Dashboard extends Component {
  toggleDashboardDropdown = () => {
    this.setState(prevState => {
      return { ...prevState, dashboardDropdownOpened: !this.state.dashboardDropdownOpened };
    });
  };

  getDashboards = async () => {
    try {
      await this.setState({
        getDashboardsError: false,
        loading: true
      });
      const dashboards = await this.props.httpClient.get('/api/v1/dashboard');
      let currentDashboardSelector;
      if (this.props.dashboardSelector) {
        currentDashboardSelector = this.props.dashboardSelector;
      } else if (dashboards.length > 0) {
        currentDashboardSelector = dashboards[0].selector;
      }
      await this.setState({
        dashboards,
        currentDashboardSelector,
        getDashboardsError: false,
        loading: false
      });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
      const status = get(e, 'response.status');
      const errorMessage = get(e, 'response.error_message');
      // in case we are on the gateway (Gladys Plus)
      if (status === 404 && errorMessage === 'NO_INSTANCE_FOUND') {
        this.setState({
          gatewayInstanceNotFound: true
        });
      } else {
        this.setState({
          getDashboardsError: true
        });
      }
    }
  };

  getCurrentDashboard = async () => {
    try {
      const currentDashboard = await this.props.httpClient.get(
        `/api/v1/dashboard/${this.state.currentDashboardSelector}`
      );
      this.setState({
        currentDashboard
      });
    } catch (e) {
      console.error(e);
    }
  };

  init = async () => {
    await this.getDashboards();
    if (this.state.currentDashboardSelector) {
      await this.getCurrentDashboard();
    }
  };

  redirectToDashboard = e => {
    this.setState({
      dashboardDropdownOpened: false
    });
  };

  editDashboard = () => {
    this.setState(prevState => ({ ...prevState, dashboardEditMode: !prevState.dashboardEditMode }));
  };

  cancelDashboardEdit = async () => {
    this.setState({
      dashboardEditMode: false
    });
    await this.getCurrentDashboard();
  };

  moveCard = async (originalX, originalY, destX, destY) => {
    // incorrect coordinates
    if (destX < 0 || destY < 0) {
      return null;
    }
    if (destX >= this.state.currentDashboard.boxes.length || destY >= this.state.currentDashboard.boxes[destX].length) {
      return null;
    }
    const element = this.state.currentDashboard.boxes[originalX][originalY];
    const newStateWithoutElement = update(this.state, {
      currentDashboard: {
        boxes: {
          [originalX]: {
            $splice: [[originalY, 1]]
          }
        }
      }
    });
    const newState = update(newStateWithoutElement, {
      currentDashboard: {
        boxes: {
          [destX]: {
            $splice: [[destY, 0, element]]
          }
        }
      }
    });
    await this.setState(newState);
  };

  moveBoxDown = (x, y) => {
    this.moveCard(x, y, x, y + 1);
  };

  moveBoxUp = (x, y) => {
    this.moveCard(x, y, x, y - 1);
  };

  addBox = x => {
    if (this.state.newSelectedBoxType && this.state.newSelectedBoxType[x]) {
      const newState = update(this.state, {
        currentDashboard: {
          boxes: {
            [x]: {
              $push: [
                {
                  type: this.state.newSelectedBoxType[x]
                }
              ]
            }
          }
        }
      });
      this.setState(newState);
    }
  };

  removeBox = (x, y) => {
    const newState = update(this.state, {
      currentDashboard: {
        boxes: {
          [x]: {
            $splice: [[y, 1]]
          }
        }
      }
    });
    this.setState(newState);
  };

  updateCurrentDashboardName = e => {
    const newState = update(this.state, {
      currentDashboard: {
        name: {
          $set: e.target.value
        }
      }
    });
    this.setState(newState);
  };

  updateBoxConfig = (x, y, data) => {
    const newState = update(this.state, {
      currentDashboard: {
        boxes: {
          [x]: {
            [y]: {
              $merge: data
            }
          }
        }
      }
    });
    this.setState(newState);
  };

  updateNewSelectedBox = (x, type) => {
    const newSelectedBoxType = Object.assign({}, this.state.newSelectedBoxType, {
      [x]: type
    });
    this.setState({
      newSelectedBoxType
    });
  };

  saveDashboard = async () => {
    this.setState({
      loading: true
    });
    try {
      const currentDashboard = await this.props.httpClient.patch(
        `/api/v1/dashboard/${this.state.currentDashboard.selector}`,
        this.state.currentDashboard
      );
      this.setState({
        currentDashboard,
        dashboardEditMode: false,
        loading: false,
        error: false
      });
    } catch (e) {
      if (e.response && e.response.status === 422) {
        this.setState({
          dashboardSavingStatus: RequestStatus.ValidationError
        });
      } else {
        this.setState({
          dashboardSavingStatus: RequestStatus.Error
        });
      }
    }
  };

  deleteCurrentDashboard = async () => {
    try {
      await this.props.httpClient.delete(`/api/v1/dashboard/${this.state.currentDashboard.selector}`);
      await this.setState({
        dashboardDropdownOpened: false,
        dashboardEditMode: false
      });
      this.init();
      route('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.props.setFullScreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      this.props.setFullScreen(false);
    }
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      dashboardDropdownOpened: false,
      dashboardEditMode: false,
      dashboards: [],
      newSelectedBoxType: {}
    };
  }

  componentDidMount() {
    this.init();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUrl !== this.props.currentUrl) {
      this.init();
    }
  }

  render(props, { dashboardDropdownOpened, dashboards, currentDashboard, dashboardEditMode, gatewayInstanceNotFound }) {
    const dashboardConfigured =
      currentDashboard &&
      currentDashboard.boxes &&
      ((currentDashboard.boxes[0] && currentDashboard.boxes[0].length > 0) ||
        (currentDashboard.boxes[1] && currentDashboard.boxes[1].length > 0) ||
        (currentDashboard.boxes[2] && currentDashboard.boxes[2].length > 0));
    const dashboardNotConfigured = !dashboardConfigured;
    return (
      <DashboardPage
        {...props}
        dashboardDropdownOpened={dashboardDropdownOpened}
        dashboardEditMode={dashboardEditMode}
        dashboards={dashboards}
        currentDashboard={currentDashboard}
        gatewayInstanceNotFound={gatewayInstanceNotFound}
        dashboardNotConfigured={dashboardNotConfigured}
        toggleDashboardDropdown={this.toggleDashboardDropdown}
        redirectToDashboard={this.redirectToDashboard}
        editDashboard={this.editDashboard}
        cancelDashboardEdit={this.cancelDashboardEdit}
        moveBoxDown={this.moveBoxDown}
        moveBoxUp={this.moveBoxUp}
        addBox={this.addBox}
        removeBox={this.removeBox}
        updateNewSelectedBox={this.updateNewSelectedBox}
        saveDashboard={this.saveDashboard}
        updateBoxConfig={this.updateBoxConfig}
        toggleFullScreen={this.toggleFullScreen}
        updateCurrentDashboardName={this.updateCurrentDashboardName}
        deleteCurrentDashboard={this.deleteCurrentDashboard}
        fullScreen={props.fullScreen}
      />
    );
  }
}

export default Dashboard;
