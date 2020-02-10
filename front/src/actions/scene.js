import { RequestStatus } from '../utils/consts';
import update, { extend } from 'immutability-helper';
import debounce from 'debounce';
import { route } from 'preact-router';

extend('$auto', function(value, object) {
  return object ? update(object, value) : update({}, value);
});

function createActions(store) {
  const actions = {
    async getScenes(state) {
      store.setState({
        scenesGetStatus: RequestStatus.Getting
      });
      try {
        const orderDir = state.getScenesOrderDir || 'asc';
        const params = {
          order_dir: orderDir
        };
        if (state.sceneSearch && state.sceneSearch.length) {
          params.search = state.sceneSearch;
        }
        const scenes = await state.httpClient.get('/api/v1/scene', params);
        store.setState({
          scenes,
          scenesGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          scenesGetStatus: RequestStatus.Error
        });
      }
    },
    async search(state, e) {
      store.setState({
        sceneSearch: e.target.value
      });
      await actions.getScenes(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getScenesOrderDir: e.target.value
      });
      await actions.getScenes(store.getState());
    },
    async getSceneBySelector(state, sceneSelector) {
      store.setState({
        SceneGetStatus: RequestStatus.Getting
      });
      try {
        const scene = await state.httpClient.get(`/api/v1/scene/${sceneSelector}`);
        if (scene.actions[scene.actions.length - 1].length > 0) {
          scene.actions.push([]);
        }
        if (!scene.triggers) {
          scene.triggers = [];
        }
        store.setState({
          scene,
          SceneGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          SceneGetStatus: RequestStatus.Error
        });
      }
    },
    async startScene(state, selector) {
      store.setState({
        SceneStartStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post(`/api/v1/scene/${selector}/start`);
        store.setState({
          SceneStartStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          SceneStartStatus: RequestStatus.Error
        });
      }
    },
    async saveScene(state) {
      await state.httpClient.patch(`/api/v1/scene/${state.scene.selector}`, state.scene);
    },
    addAction(state, columnIndex) {
      let newState = update(state, {
        scene: {
          actions: {
            [columnIndex]: {
              $push: [
                {
                  type: null
                }
              ]
            }
          }
        }
      });
      if (state.scene.actions[columnIndex].length === 0) {
        newState = update(newState, {
          scene: {
            actions: {
              $push: [[]]
            }
          }
        });
      }
      store.setState(newState);
    },
    deleteAction(state, columnIndex, rowIndex) {
      let newState = update(state, {
        scene: {
          actions: {
            [columnIndex]: {
              $splice: [[rowIndex, 1]]
            }
          }
        }
      });
      // if necessary, we remove the last action group
      if (newState.scene.actions.length >= 2) {
        if (
          newState.scene.actions[newState.scene.actions.length - 1].length === 0 &&
          newState.scene.actions[newState.scene.actions.length - 2].length === 0
        ) {
          newState = update(newState, {
            scene: {
              actions: {
                $splice: [[newState.scene.actions.length - 1, 1]]
              }
            }
          });
        }
      }
      store.setState(newState);
    },
    updateActionProperty(state, columnIndex, rowIndex, property, value) {
      const newState = update(state, {
        scene: {
          actions: {
            [columnIndex]: {
              [rowIndex]: {
                [property]: {
                  $set: value
                }
              }
            }
          }
        }
      });
      store.setState(newState);
    },
    highlighCurrentlyExecutedAction(state, { columnIndex, rowIndex }) {
      store.setState({
        highLightedActions: {
          [`${columnIndex}:${rowIndex}`]: true
        }
      });
    },
    removeHighlighAction(state, { columnIndex, rowIndex }) {
      setTimeout(() => {
        store.setState({
          highLightedActions: {
            [`${columnIndex}:${rowIndex}`]: false
          }
        });
      }, 500);
    },
    async getUsers(state) {
      store.setState({
        GetUsersStatus: RequestStatus.Getting
      });
      try {
        const users = await state.httpClient.get(`/api/v1/user`);
        const sceneParamsData = {
          users
        };
        store.setState({
          sceneParamsData,
          GetUsersStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          GetUsersStatus: RequestStatus.Error
        });
      }
    },
    async deleteScene(state, selector) {
      store.setState({
        deleteSceneStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.delete(`/api/v1/scene/${selector}`);
        store.setState({
          deleteSceneStatus: RequestStatus.Success
        });
        route('/dashboard/scene');
      } catch (e) {
        store.setState({
          GetUsersStatus: RequestStatus.Error
        });
      }
    },
    addTrigger(state) {
      const newState = update(state, {
        scene: {
          triggers: {
            $push: [
              {
                type: null
              }
            ]
          }
        }
      });
      store.setState(newState);
    },
    deleteTrigger(state, index) {
      const newState = update(state, {
        scene: {
          triggers: {
            $splice: [[index, 1]]
          }
        }
      });
      store.setState(newState);
    },
    updateTriggerProperty(state, index, property, value) {
      console.log({ index, property, value });
      const newState = update(state, {
        scene: {
          triggers: {
            [index]: {
              [property]: {
                $set: value
              }
            }
          }
        }
      });
      store.setState(newState);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return actions;
}

export default createActions;
