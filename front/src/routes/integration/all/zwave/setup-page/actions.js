import get from 'get-value';
import update from 'immutability-helper';

import { RequestStatus } from '../../../../../utils/consts';
import { ERROR_MESSAGES } from '../../../../../../../server/utils/constants';
import createActionsIntegration from '../../../../../actions/integration';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getNodes(state) {
      store.setState({
        zwaveGetNodesStatus: RequestStatus.Getting
      });
      try {
        const zwaveNodes = await state.httpClient.get('/api/v1/service/zwave/node');

        store.setState({
          zwaveNodes,
          zwaveGetNodesStatus: RequestStatus.Success
        });
      } catch (e) {
        const responseMessage = get(e, 'response.data.message');
        if (responseMessage === ERROR_MESSAGES.SERVICE_NOT_CONFIGURED) {
          store.setState({
            zwaveGetNodesStatus: RequestStatus.ServiceNotConfigured
          });
        } else {
          store.setState({
            zwaveGetNodesStatus: RequestStatus.Error
          });
        }
      }
    },
    async addNode(state, e, secure = false) {
      if (e) {
        e.preventDefault();
      }
      store.setState({
        zwaveAddNodeStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/node/add', {
          secure
        });
        store.setState({
          zwaveAddNodeStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveAddNodeStatus: RequestStatus.Error
        });
      }
    },
    async addNodeSecure(state, e) {
      actions.addNode(state, e, true);
    },
    async stopAddNode(state) {
      store.setState({
        zwaveStopAddNodeStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/cancel');
        store.setState({
          zwaveStopAddNodeStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveStopAddNodeStatus: RequestStatus.Error
        });
      }
    },
    async healNetwork(state) {
      store.setState({
        zwaveHealNetworkStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/heal');
        store.setState({
          zwaveHealNetworkStatus: RequestStatus.Success
        });
        actions.getStatus(store.getState());
      } catch (e) {
        store.setState({
          zwaveHealNetworkStatus: RequestStatus.Error
        });
      }
    },
    async getStatus(state) {
      store.setState({
        zwaveGetStatusStatus: RequestStatus.Getting
      });
      try {
        const zwaveStatus = await state.httpClient.get('/api/v1/service/zwave/status');
        store.setState({
          zwaveStatus,
          zwaveGetStatusStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveGetStatusStatus: RequestStatus.Error
        });
      }
    },
    async createDevice(state, newDevice) {
      await state.httpClient.post('/api/v1/device', newDevice);
    },
    editNodeName(state, index, name) {
      const newState = update(state, {
        zwaveNodes: {
          [index]: {
            name: {
              $set: name
            }
          }
        }
      });
      store.setState(newState);
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
