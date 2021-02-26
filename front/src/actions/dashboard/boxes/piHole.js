import { RequestStatus, GetPiholeStatus } from '../../../utils/consts';
import { ERROR_MESSAGES } from '../../../../../server/utils/constants';
import createBoxActions from '../boxActions';
import get from 'get-value';

const BOX_KEY = 'pihole';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getPiholeSummary(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const piholedatas = await state.httpClient.get(`/api/v1/pihole/getPiholeSummary`);
        const errorMsg = piholedatas['Error Message'];
        if (errorMsg) {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, GetStockExchangeStatus.ServiceNotConfigured);
          boxActions.mergeBoxData(state, BOX_KEY, x, y, {
            error: errorMsg
          });
        } else {
          boxActions.mergeBoxData(state, BOX_KEY, x, y, {
            piholedatas
          });
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
        }
      } catch (e) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          piholedatas: null
        });

        const responseMessage = get(e, 'response.data.message');
        if (responseMessage === ERROR_MESSAGES.SERVICE_NOT_CONFIGURED) {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, GetPiholeStatus.ServiceNotConfigured);
        } else if (responseMessage === ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED) {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, GetPiholeStatus.RequestToThirdPartyFailed);
        } else {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
        }
      }
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
