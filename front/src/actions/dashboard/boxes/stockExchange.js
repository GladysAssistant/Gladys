import { RequestStatus, GetStockExchangeStatus } from '../../../utils/consts';
import { ERROR_MESSAGES } from '../../../../../server/utils/constants';
import createBoxActions from '../boxActions';
import get from 'get-value';

const BOX_KEY = 'StockExchange';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getIndex(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const stockexchangedatas = await state.httpClient.get(`/api/v1/stockexchange/getStockExchangeIndexQuote`);
        const error = stockexchangedatas["Error Message"];
        if (error) {
            boxActions.updateBoxStatus(state, BOX_KEY, x, y, GetStockExchangeStatus.ServiceNotConfigured);
            boxActions.mergeBoxData(state, BOX_KEY, x, y, {
              error: error
            });
        } else {
          boxActions.mergeBoxData(state, BOX_KEY, x, y, {
            stockexchangedatas
          });
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
        }
      } catch (e) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          stockexchangedatas: null
        });

        const responseMessage = get(e, 'response.data.message');
        if (responseMessage === ERROR_MESSAGES.SERVICE_NOT_CONFIGURED) {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, GetStockExchangeStatus.ServiceNotConfigured);
        } else if (responseMessage === ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED) {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, GetStockExchangeStatus.RequestToThirdPartyFailed);
        } else {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
        }

      }
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
