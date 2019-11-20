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
    async cancelZwaveCommand(state) {
      store.setState({
        zwaveCancelZwaveCommandStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/cancel');
        store.setState({
          zwaveCancelZwaveCommandStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveCancelZwaveCommandStatus: RequestStatus.Error
        });
      }
    },
    async removeNode(state, secure = false) {
      store.setState({
        zwaveRemoveNodeStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/node/remove');
        store.setState({
          zwaveRemoveNodeStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveRemoveNodeStatus: RequestStatus.Error
        });
      }
    }
  };

  return actions;
};

export default actions;
