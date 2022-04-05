import { RequestStatus } from '../utils/consts';
import update from 'immutability-helper';
import get from 'get-value';
import { route } from 'preact-router';

function createActions(store) {
  const actions = {
    async checkErrors(state, e) {
      let newSceneErrors = {};

      if (state.selecticonViewLoading === true) {
        store.setState({
          newSceneErrors,
          selecticonViewLoading: false
        });
        return;
      }
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
    initScene(state) {
      store.setState({
        newScene: {
          name: '',
          icon: null,
          actions: [[]]
        },
        newSceneErrors: null,
        createSceneStatus: null,
        selectIconView: 'iconList',
        selecticonViewLoading: false
      });
    },
    handleClick(state, e) {
      if (e.target.name === 'listView') {
        store.setState({
          selectIconView: 'iconList',
          selecticonViewLoading: true
        });
      }
      if (e.target.name === 'groupView') {
        store.setState({
          selectIconView: 'iconGroup',
          selecticonViewLoading: true
        });
      }
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
