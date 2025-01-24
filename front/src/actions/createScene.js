import { RequestStatus } from '../utils/consts';
import update from 'immutability-helper';
import get from 'get-value';
import { route } from 'preact-router';

function createActions(store) {
  const actions = {
    checkErrors(state) {
      let newSceneErrors = {};
      if (!state.newScene.name) {
        newSceneErrors.name = true;
      }
      if (state.newScene.name === 'new') {
        newSceneErrors.name = true;
      }
      if (!state.newScene.icon) {
        newSceneErrors.icon = true;
      }
      store.setState({
        newSceneErrors
      });
      return Object.keys(newSceneErrors).length > 0;
    },
    async createScene(state, e) {
      e.preventDefault();
      // if errored, we don't continue
      if (actions.checkErrors(state)) {
        return;
      }
      store.setState({
        createSceneStatus: RequestStatus.Getting
      });
      try {
        const createdScene = await state.httpClient.post('/api/v1/scene', state.newScene);
        store.setState({
          createSceneStatus: RequestStatus.Success
        });
        route(`/dashboard/scene/${createdScene.selector}`);
      } catch (e) {
        const status = get(e, 'response.status');
        if (status === 409) {
          store.setState({
            createSceneStatus: RequestStatus.ConflictError
          });
        } else {
          store.setState({
            createSceneStatus: RequestStatus.Error
          });
        }
      }
    },
    initScene() {
      store.setState({
        newScene: {
          name: '',
          icon: null,
          actions: [[]],
          tags: []
        },
        newSceneErrors: null,
        createSceneStatus: null
      });
    },
    updateNewSceneName(state, e) {
      const newState = update(state, {
        newScene: {
          name: {
            $set: e.target.value
          }
        }
      });
      store.setState(newState);
      if (state.newSceneErrors) {
        actions.checkErrors(store.getState());
      }
    },
    updateNewSceneIcon(state, e) {
      const newState = update(state, {
        newScene: {
          icon: {
            $set: e.target.value
          }
        }
      });
      store.setState(newState);
      if (state.newSceneErrors) {
        actions.checkErrors(store.getState());
      }
    }
  };
  return actions;
}

export default createActions;
