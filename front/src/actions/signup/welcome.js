import { RequestStatus } from '../../utils/consts';
import { route } from 'preact-router';

function createActions(store) {
  const actions = {
    async checkIfInstanceIsConfigured(state) {
      // check instance state
      store.setState({
        checkIfInstanceIsConfiguredRequestState: RequestStatus.Getting
      });
      try {
        const instanceState = await state.httpClient.get('/api/v1/setup');
        if (instanceState.account_configured) {
          route('/login');
        }
        store.setState({
          checkIfInstanceIsConfiguredRequestState: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          checkIfInstanceIsConfiguredRequestState: RequestStatus.Error
        });
      }
    }
  };

  return actions;
}

export default createActions;
