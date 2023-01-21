import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import update, { extend } from 'immutability-helper';
import DashboardPage from './DashboardPage';
import GatewayAccountExpired from '../../components/gateway/GatewayAccountExpired';
import actions from '../../actions/dashboard';
import get from 'get-value';

extend('$auto', (value, object) => {
  return object ? update(object, value) : update({}, value);
});

@connect('user,fullScreen,currentUrl,httpClient,gatewayAccountExpired', actions)
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
      await this.setState({ loading: true });
      const currentDashboard = await this.props.httpClient.get(
        `/api/v1/dashboard/${this.state.currentDashboardSelector}`
      );
      this.setState({
        currentDashboard,
        loading: false
      });
    } catch (e) {
      this.setState({
        loading: false
      });
      console.error(e);
    }
  };

  init = async () => {
    await this.getDashboards();
    if (this.state.currentDashboardSelector) {
      await this.getCurrentDashboard();
    }
  };

  redirectToDashboard = () => {
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
      loading: true,
      dashboardValidationError: false,
      dashboardAlreadyExistError: false,
      unknownError: false
    });
    try {
      const { currentDashboard: selectedDashboard, dashboards } = this.state;
      const { selector } = selectedDashboard;

      const currentDashboard = await this.props.httpClient.patch(
        `/api/v1/dashboard/${selector}`,
        this.state.currentDashboard
      );

      const currentDashboardIndex = dashboards.findIndex(d => d.selector === selector);
      const updatedDashboards = update(dashboards, {
        [currentDashboardIndex]: {
          $set: currentDashboard
        }
      });

      this.setState({
        currentDashboard,
        dashboardEditMode: false,
        loading: false,
        dashboards: updatedDashboards
      });
    } catch (e) {
      if (e.response && e.response.status === 422) {
        this.setState({
          dashboardValidationError: true
        });
      } else if (e.response && e.response.status === 409) {
        this.setState({
          dashboardAlreadyExistError: true
        });
      } else {
        this.setState({
          unknownError: true
        });
      }
    }
  };

  askDeleteCurrentDashboard = async () => {
    await this.setState({
      askDeleteDashboard: true
    });
  };

  cancelDeleteCurrentDashboard = async () => {
    await this.setState({
      askDeleteDashboard: false
    });
  };

  deleteCurrentDashboard = async () => {
    try {
      await this.props.httpClient.delete(`/api/v1/dashboard/${this.state.currentDashboard.selector}`);
      const dashboardIndex = this.state.dashboards.findIndex(d => d.id === this.state.currentDashboard.id);
      const dashboards = update(this.state.dashboards, {
        $splice: [[dashboardIndex, 1]]
      });
      const currentDashboard = dashboards.length > 0 ? dashboards[0] : null;
      await this.setState({
        dashboards,
        currentDashboard,
        dashboardDropdownOpened: false,
        dashboardEditMode: false,
        askDeleteDashboard: false
      });
      this.init();
      route('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  isBrowserFullScreenCompatible = () => {
    return document.fullscreenEnabled || document.webkitFullscreenEnabled;
  };

  isFullScreen = () => {
    return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
  };

  toggleFullScreen = () => {
    const isFullScreen = this.isFullScreen();
    if (!isFullScreen) {
      if (document.documentElement.requestFullscreen) {
        // chrome & firefox
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        // safari
        document.documentElement.webkitRequestFullscreen();
      }
      this.props.setFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        // chrome & firefox
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        // safari
        document.webkitExitFullscreen();
      }
      this.props.setFullScreen(false);
    }
  };

  onFullScreenChange = () => {
    const isFullScreen = this.isFullScreen();
    this.props.setFullScreen(isFullScreen);
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      dashboardDropdownOpened: false,
      dashboardEditMode: false,
      browserFullScreenCompatible: this.isBrowserFullScreenCompatible(),
      dashboards: [],
      newSelectedBoxType: {},
      askDeleteDashboard: false
    };
  }

  componentDidMount() {
    this.init();
    document.addEventListener('fullscreenchange', this.onFullScreenChange, false);
    document.addEventListener('webkitfullscreenchange', this.onFullScreenChange, false);
    document.addEventListener('mozfullscreenchange', this.onFullScreenChange, false);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUrl !== this.props.currentUrl) {
      this.init();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('fullscreenchange', this.onFullScreenChange, false);
    document.removeEventListener('webkitfullscreenchange', this.onFullScreenChange, false);
    document.removeEventListener('mozfullscreenchange', this.onFullScreenChange, false);
  }

  render(
    props,
    {
      dashboardDropdownOpened,
      dashboards,
      currentDashboard,
      dashboardEditMode,
      gatewayInstanceNotFound,
      loading,
      browserFullScreenCompatible,
      dashboardValidationError,
      dashboardAlreadyExistError,
      unknownError,
      askDeleteDashboard
    }
  ) {
    const dashboardConfigured =
      currentDashboard &&
      currentDashboard.boxes &&
      ((currentDashboard.boxes[0] && currentDashboard.boxes[0].length > 0) ||
        (currentDashboard.boxes[1] && currentDashboard.boxes[1].length > 0) ||
        (currentDashboard.boxes[2] && currentDashboard.boxes[2].length > 0));
    const dashboardListEmpty = !(dashboards && dashboards.length > 0);
    const dashboardNotConfigured = !dashboardConfigured;
    if (props.gatewayAccountExpired === true) {
      return <GatewayAccountExpired />;
    }
    return (
      <DashboardPage
        {...props}
        dashboardDropdownOpened={dashboardDropdownOpened}
        dashboardEditMode={dashboardEditMode}
        dashboards={dashboards}
        dashboardListEmpty={dashboardListEmpty}
        currentDashboard={currentDashboard}
        gatewayInstanceNotFound={gatewayInstanceNotFound}
        loading={loading}
        dashboardNotConfigured={dashboardNotConfigured}
        browserFullScreenCompatible={browserFullScreenCompatible}
        dashboardValidationError={dashboardValidationError}
        dashboardAlreadyExistError={dashboardAlreadyExistError}
        unknownError={unknownError}
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
        askDeleteCurrentDashboard={this.askDeleteCurrentDashboard}
        cancelDeleteCurrentDashboard={this.cancelDeleteCurrentDashboard}
        deleteCurrentDashboard={this.deleteCurrentDashboard}
        askDeleteDashboard={askDeleteDashboard}
        fullScreen={props.fullScreen}
      />
    );
  }
}

export default Dashboard;
