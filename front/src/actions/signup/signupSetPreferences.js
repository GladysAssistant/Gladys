import { RequestStatus } from '../../utils/consts';
import { SYSTEM_VARIABLE_NAMES } from '../../../../server/utils/constants';
import update from 'immutability-helper';
import { route } from 'preact-router';

function createActions(store) {
  const actions = {
    resetPreferences() {
      store.setState({
        signupUserPreferences: {
          temperature_unit_preference: 'celsius',
          distance_unit_preference: 'metric'
        },
        signupSystemPreferences: {
          [SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS]: 90
        }
      });
    },
    updateUserPreferences(state, property, value) {
      const newState = update(state, {
        signupUserPreferences: {
          [property]: {
            $set: value
          }
        }
      });
      store.setState(newState);
    },
    updateSystemPreferences(state, property, value) {
      const newState = update(state, {
        signupSystemPreferences: {
          [property]: {
            $set: value
          }
        }
      });
      store.setState(newState);
    },
    async savePreferences(state) {
      // saving user preferences
      store.setState({
        signupSaveUserPreferences: RequestStatus.Getting
      });
      try {
        await state.httpClient.patch(`/api/v1/me`, state.signupUserPreferences);
        store.setState({
          signupSaveUserPreferences: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          signupSaveUserPreferences: RequestStatus.Error
        });
      }
      // saving system preferences
      store.setState({
        signupSaveSystemPreferences: RequestStatus.Getting
      });
      try {
        await state.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS}`, {
          value: state.signupSystemPreferences[SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS]
        });
        await state.httpClient.post(
          `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_AGGREGATE_STATE_HISTORY_IN_DAYS}`,
          {
            value: state.signupSystemPreferences[SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS]
          }
        );
        store.setState({
          signupSaveSystemPreferences: RequestStatus.Success
        });
        route('/signup/configure-house');
      } catch (e) {
        store.setState({
          signupSaveSystemPreferences: RequestStatus.Error
        });
      }
    }
  };
  return actions;
}

export default createActions;
