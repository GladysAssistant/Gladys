import { RequestStatus } from '../utils/consts';
import update from 'immutability-helper';

function createActions(store) {
  const actions = {
    async getSessions(state) {
      store.setState({
        sessionsGetStatus: RequestStatus.Getting
      });
      try {
        const sessions = await state.httpClient.get('/api/v1/session');
        store.setState({
          sessions,
          sessionsGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          sessionsGetStatus: RequestStatus.Error
        });
      }
    },
    async revokeSession(state, sessionId, index) {
      store.setState({
        sessionsRevokeStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post(`/api/v1/session/${sessionId}/revoke`);
        const sessions = update(state.sessions, {
          $splice: [[index, 1]]
        });
        store.setState({
          sessions,
          sessionsRevokeStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          sessionsRevokeStatus: RequestStatus.Error
        });
      }
    }
  };
  return actions;
}

export default createActions;
