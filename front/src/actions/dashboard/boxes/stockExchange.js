import { RequestStatus } from '../../../utils/consts';
import { ERROR_MESSAGES } from '../../../../../server/utils/constants';
import createBoxActions from '../boxActions';
import dayjs from 'dayjs';
import get from 'get-value';

const BOX_KEY = 'StockExchange';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getIndex(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const stockexchangedata = await state.httpClient.get(`/api/v1/stockexchange/getStockExchangeIndexQuote`);

        const name = stockexchangedata[0]["name"];
        const index = stockexchangedata[0]["price"];

        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          name,
          index
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          quote: null
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
