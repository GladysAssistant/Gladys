import { RequestStatus } from '../../../../../utils/consts';

const actions = store => {
  const actions = {
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
    async cancelZwaveCommand(state) {
      store.setState({
        zwaveCancelZwaveCommandStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave-js-ui/cancel');
        store.setState({
          zwaveCancelZwaveCommandStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveCancelZwaveCommandStatus: RequestStatus.Error
        });
      }
    },
    async removeNode(state) {
      store.setState({
        zwaveRemoveNodeStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave-js-ui/node/remove');
        store.setState({
          zwaveRemoveNodeStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveRemoveNodeStatus: RequestStatus.Error
        });
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
      } catch (e) {
        store.setState({
          zwaveScanNetworkStatus: RequestStatus.Error
        });
      }
    }
  };

  return actions;
};

export default actions;
