import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import get from 'get-value';

dayjs.extend(relativeTime);

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async checkStatus(state) {
      let nodeRedStatus = {
        nodeRedExist: false,
        nodeRedRunning: false,
        nodeRedEnabled: false,
        dockerBased: false,
        networkModeValid: false,
      };
      try {
        nodeRedStatus = await state.httpClient.get('/api/v1/service/node-red/status');
      } finally {
        store.setState({
          nodeRedExist: nodeRedStatus.nodeRedExist,
          nodeRedRunning: nodeRedStatus.nodeRedRunning,
          nodeRedEnabled: nodeRedStatus.nodeRedEnabled,
          dockerBased: nodeRedStatus.dockerBased,
          networkModeValid: nodeRedStatus.networkModeValid,
        });
      }
    },

    async startContainer(state) {
      let nodeRedEnabled = true;
      let error = false;

      store.setState({
        nodeRedEnabled,
        nodeRedStatus: RequestStatus.Getting
      });

      await state.httpClient.post('/api/v1/service/node-red/variable/NODERED_ENABLED', {
        value: nodeRedEnabled
      });

      try {
        await state.httpClient.post('/api/v1/service/node-red/connect');
      } catch (e) {
        error = error | get(e, 'response.status');
      }

      if (error) {
        store.setState({
          nodeRedStatus: RequestStatus.Error,
          nodeRedEnabled: false
        });
      } else {
        store.setState({
          nodeRedStatus: RequestStatus.Success,
          nodeRedEnabled: true
        });
      }

      await this.checkStatus();
    },

    async stopContainer(state) {
      let error = false;
      try {
        await state.httpClient.post('/api/v1/service/node-red/disconnect');
      } catch (e) {
        error = error | get(e, 'response.status');
      }

      if (error) {
        store.setState({
          nodeRedStatus: RequestStatus.Error
        });
      } else {
        store.setState({
          nodeRedStatus: RequestStatus.Success
        });
      }

      await this.checkStatus();
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
