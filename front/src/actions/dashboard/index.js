import { RequestStatus } from '../../utils/consts';
import update from 'immutability-helper';
import { DASHBOARD_TYPE } from '../../../../server/utils/constants';

const EMPTY_DASHBOARD = {
  name: 'Home',
  selector: 'home',
  type: DASHBOARD_TYPE.MAIN,
  boxes: [[], [], []]
};

function createActions(store) {
  const actions = {
    editDashboard(state) {
      store.setState({
        dashboardEditMode: !state.dashboardEditMode
      });
    },
    onDragStart(state, x, y) {
      store.setState({
        currentDragBoxX: x,
        currentDragBoxY: y
      });
    },
    onDragOver(state, x, y) {
      store.setState({});
    },
    onDrop(state, x, y) {
      actions.moveCard(state, state.currentDragBoxX, state.currentDragBoxY, x, y);
    },
    setDashboardConfigured(state) {
      const homeDashboard = state.homeDashboard;
      const dashboardConfigured =
        homeDashboard &&
        homeDashboard.boxes &&
        ((homeDashboard.boxes[0] && homeDashboard.boxes[0].length > 0) ||
          (homeDashboard.boxes[1] && homeDashboard.boxes[1].length > 0) ||
          (homeDashboard.boxes[2] && homeDashboard.boxes[2].length > 0));
      store.setState({
        dashboardNotConfigured: !dashboardConfigured
      });
    },
    moveCard(state, originalX, originalY, destX, destY) {
      // incorrect coordinates
      if (destX < 0 || destY < 0) {
        return null;
      }
      if (destX >= state.homeDashboard.boxes.length || destY >= state.homeDashboard.boxes[destX].length) {
        return null;
      }
      const element = state.homeDashboard.boxes[originalX][originalY];
      const newStateWithoutElement = update(state, {
        homeDashboard: {
          boxes: {
            [originalX]: {
              $splice: [[originalY, 1]]
            }
          }
        }
      });
      const newState = update(newStateWithoutElement, {
        homeDashboard: {
          boxes: {
            [destX]: {
              $splice: [[destY, 0, element]]
            }
          }
        }
      });
      store.setState(newState);
    },
    moveBoxDown(state, x, y) {
      actions.moveCard(state, x, y, x, y + 1);
    },
    moveBoxUp(state, x, y) {
      actions.moveCard(state, x, y, x, y - 1);
    },
    addBox(state, x) {
      if (state.newSelectedBoxType && state.newSelectedBoxType[x]) {
        const newState = update(state, {
          homeDashboard: {
            boxes: {
              [x]: {
                $push: [
                  {
                    type: state.newSelectedBoxType[x]
                  }
                ]
              }
            }
          }
        });
        store.setState(newState);
      }
    },
    removeBox(state, x, y) {
      const newState = update(state, {
        homeDashboard: {
          boxes: {
            [x]: {
              $splice: [[y, 1]]
            }
          }
        }
      });
      store.setState(newState);
    },
    updateNewSelectedBox(state, x, type) {
      const currentNewSelectedBoxType = state.newSelectedBoxType || {};
      const newSelectedBoxType = Object.assign({}, currentNewSelectedBoxType, {
        [x]: type
      });
      store.setState({
        newSelectedBoxType
      });
    },
    async getBoxes(state) {
      store.setState({
        DashboardGetBoxesStatus: RequestStatus.Getting
      });
      try {
        const homeDashboard = await state.httpClient.get('/api/v1/dashboard/home');
        store.setState({
          homeDashboard,
          DashboardGetBoxesStatus: RequestStatus.Success
        });
      } catch (e) {
        if (e.response && e.response.status === 404) {
          store.setState({
            dashboardNotConfigured: true,
            homeDashboard: EMPTY_DASHBOARD
          });
        } else {
          store.setState({
            DashboardGetBoxesStatus: RequestStatus.Error
          });
        }
      }
      actions.setDashboardConfigured(store.getState());
    },
    async cancelDashboardEdit(state) {
      await actions.getBoxes(state);
      store.setState({
        dashboardEditMode: false
      });
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
          homeDashboard = await state.httpClient.patch('/api/v1/dashboard/home', state.homeDashboard);
        } else {
          homeDashboard = await state.httpClient.post('/api/v1/dashboard', state.homeDashboard);
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
