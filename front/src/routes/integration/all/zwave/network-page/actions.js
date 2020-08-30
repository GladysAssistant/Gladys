import get from 'get-value';

import { RequestStatus } from '../../../../../utils/consts';
import { ERROR_MESSAGES } from '../../../../../../../server/utils/constants';

const actions = store => ({
  async getNeighbors(state) {
    store.setState({
      zwaveGetNeighborsStatus: RequestStatus.Getting
    });
    try {
      const zwaveNodesNeighbors = await state.httpClient.get('/api/v1/service/zwave/neighbor');
      store.setState({
        zwaveNodesNeighbors,
        zwaveGetNeighborsStatus: RequestStatus.Success
      });
    } catch (e) {
      const responseMessage = get(e, 'response.data.message');
      if (responseMessage === ERROR_MESSAGES.SERVICE_NOT_CONFIGURED) {
        store.setState({
          zwaveGetNeighborsStatus: RequestStatus.ServiceNotConfigured
        });
      } else {
        store.setState({
          zwaveGetNeighborsStatus: RequestStatus.Error
        });
      }
    }
  }
});

export default actions;
