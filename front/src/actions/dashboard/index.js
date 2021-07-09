import { RequestStatus } from '../../utils/consts';
import get from 'get-value';
import { DASHBOARD_TYPE } from '../../../../server/utils/constants';

function createActions(store) {
  const actions = {
    setFullScreen(state, fullScreen) {
      store.setState({
        fullScreen
      });
    },

    async getBoxes(state) {
      store.setState({
        DashboardGetBoxesStatus: RequestStatus.Getting
      });
      try {
        const dashboards = await state.httpClient.get('/api/v1/dashboard');
        if (dashboards.length) {
          const homeDashboard = await state.httpClient.get(`/api/v1/dashboard/${dashboards[0].selector}`);
          store.setState({
            gatewayInstanceNotFound: false,
            homeDashboard,
            DashboardGetBoxesStatus: RequestStatus.Success
          });
        } else {
          store.setState({
            dashboardNotConfigured: true,
            homeDashboard: {
              name: `${state.user.firstname} home`,
              selector: `${state.user.selector}-home`,
              type: DASHBOARD_TYPE.MAIN,
              boxes: [[], [], []]
            }
          });
        }
      } catch (e) {
        const status = get(e, 'response.status');
        const errorMessage = get(e, 'response.error_message');
        if (status === 404 && errorMessage === 'NO_INSTANCE_FOUND') {
          store.setState({
            gatewayInstanceNotFound: true
          });
        } else {
          store.setState({
            DashboardGetBoxesStatus: RequestStatus.Error
          });
        }
      }
      actions.setDashboardConfigured(store.getState());
    },
    validateBoxes(state) {
      state.homeDashboard.boxes.forEach(box => {
        switch (box.type) {
          case 'weather':
            if (!box.house) {
            }
        }
      });
    },
    async saveDashboard(state) {
      store.setState({
        DashboardSavingStatus: RequestStatus.Getting
      });
      try {
        let homeDashboard;
        if (state.homeDashboard.id) {
          homeDashboard = await state.httpClient.patch(
            `/api/v1/dashboard/${state.homeDashboard.selector}`,
            state.homeDashboard
          );
        } else {
          const homeDashboardToCreate = {
            ...state.homeDashboard,
            name: `${state.user.firstname} home`,
            selector: `${state.user.selector}-home`
          };
          homeDashboard = await state.httpClient.post('/api/v1/dashboard', homeDashboardToCreate);
        }
        store.setState({
          homeDashboard,
          dashboardEditMode: false,
          DashboardSavingStatus: RequestStatus.Success
        });
      } catch (e) {
        if (e.response && e.response.status === 422) {
          store.setState({
            DashboardSavingStatus: RequestStatus.ValidationError
          });
        } else {
          store.setState({
            DashboardSavingStatus: RequestStatus.Error
          });
        }
      }
      actions.setDashboardConfigured(store.getState());
    }
  };
  return actions;
}

export default createActions;
