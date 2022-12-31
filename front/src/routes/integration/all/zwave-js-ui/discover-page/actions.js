import get from 'get-value';
import update from 'immutability-helper';

import { RequestStatus } from '../../../../../utils/consts';
import { ERROR_MESSAGES } from '../../../../../../../server/utils/constants';
import { slugify } from '../../../../../../../server/utils/slugify';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getNodes(state) {
      store.setState({
        zwaveGetNodesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getZwaveDeviceOrderDir || 'asc'
        };
        if (state.zwaveDeviceSearch && state.zwaveDeviceSearch.length) {
          options.search = state.zwaveDeviceSearch;
        }
        const zwaveNodes = await state.httpClient.get('/api/v1/service/zwave-js-ui/node', options);

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
    async scanNetwork(state) {
      store.setState({
        zwaveScanNetworkStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave-js-ui/scan');
        store.setState({
          zwaveScanNetworkStatus: RequestStatus.Success
        });
        actions.getStatus(store.getState());
      } catch (e) {
        store.setState({
          zwaveScanNetworkStatus: RequestStatus.Error
        });
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
        await state.httpClient.post('/api/v1/service/zwave-js-ui/node/add', {
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
        await state.httpClient.post('/api/v1/service/zwave-js-ui/cancel');
        store.setState({
          zwaveStopAddNodeStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveStopAddNodeStatus: RequestStatus.Error
        });
      }
    },
    async getStatus(state) {
      store.setState({
        zwaveGetStatusStatus: RequestStatus.Getting
      });
      try {
        const zwaveStatus = await state.httpClient.get('/api/v1/service/zwave-js-ui/status');
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
            },
            selector: {
              $set: slugify(name)
            }
          }
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        zwaveDeviceSearch: e.target.value
      });
      await actions.getNodes(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getZwaveDeviceOrderDir: e.target.value
      });
      await actions.getNodes(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, integrationActions, actions);
};

export default createActions;
