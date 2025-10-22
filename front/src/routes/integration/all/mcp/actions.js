import { SESSION_TOKEN_TYPES } from '../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';

function createActions(store) {
  const actions = {
    async getMCPApiKeys(state) {
      store.setState({
        sessionsGetStatus: RequestStatus.Getting
      });
      try {
        const mcpApiKeys = await state.httpClient.get('/api/v1/session', {
          scope: ['mcp'],
          token_type: SESSION_TOKEN_TYPES.API_KEY
        });
        store.setState({
          mcpApiKeys,
          sessionsGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          sessionsGetStatus: RequestStatus.Error
        });
      }
    },
    async createMCPApiKey(state) {
      if (!state.newMCPClient || state.newMCPClient.length === 0) {
        return store.setState({ missingNewMCPClient: true });
      }

      store.setState({
        sessionsCreateStatus: RequestStatus.Getting
      });
      try {
        const newApiKey = await state.httpClient.post('/api/v1/session/api_key', {
          scope: ['mcp'],
          useragent: state.newMCPClient
        });
        const mcpApiKeys = update(state.mcpApiKeys, {
          $push: [{ ...newApiKey, useragent: state.newMCPClient }]
        });
        store.setState({
          mcpApiKeys,
          sessionsCreateStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          sessionsCreateStatus: RequestStatus.Error
        });
      }
    },
    async revokeMCPApiKey(state, sessionId, index) {
      store.setState({
        sessionsRevokeStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post(`/api/v1/session/${sessionId}/revoke`);
        const mcpApiKeys = update(state.mcpApiKeys, {
          $splice: [[index, 1]]
        });
        store.setState({
          mcpApiKeys,
          sessionsRevokeStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          sessionsRevokeStatus: RequestStatus.Error
        });
      }
    },
    updateNewMCPClient(state, e) {
      store.setState({
        newMCPClient: e.target.value
      });
    }
  };
  return actions;
}

export default createActions;
