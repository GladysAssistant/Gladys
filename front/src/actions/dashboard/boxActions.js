import update, { extend } from 'immutability-helper';

extend('$auto', (value, object) => {
  return object ? update(object, value) : update({}, value);
});

import get from 'get-value';

import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../utils/consts';

function createActions(store) {
  const actions = {
    updateBoxStatus(state, key, x, y, status) {
      // we mutate safely the status
      const newState = update(store.getState(), {
        [`${DASHBOARD_BOX_STATUS_KEY}${key}`]: {
          $auto: {
            [`${x}_${y}`]: {
              $auto: {
                $set: status
              }
            }
          }
        }
      });
      // and we save the state
      store.setState(newState);
    },
    mergeBoxData(state, key, x, y, data) {
      // we merge the old with the new one
      const newState = update(store.getState(), {
        [`${DASHBOARD_BOX_DATA_KEY}${key}`]: {
          $auto: {
            [`${x}_${y}`]: {
              $auto: {
                $merge: data
              }
            }
          }
        }
      });
      // and we set the state
      store.setState(newState);
    },
    getBoxStatus(state, key, x, y) {
      // we refresh the state the be sure we have the latest state
      const currentState = store.getState();
      // we get the current box data and return it
      return get(currentState, `${DASHBOARD_BOX_STATUS_KEY}${key}.${x}_${y}`);
    },
    getBoxData(state, key, x, y) {
      // we refresh the state the be sure we have the latest state
      const currentState = store.getState();
      // we get the current box data and return it
      return get(currentState, `${DASHBOARD_BOX_DATA_KEY}${key}.${x}_${y}`);
    },
    updateBoxConfig(state, x, y, data) {
      const newState = update(state, {
        homeDashboard: {
          boxes: {
            [x]: {
              [y]: {
                $merge: data
              }
            }
          }
        }
      });
      store.setState(newState);
    }
  };
  return actions;
}

export default createActions;
