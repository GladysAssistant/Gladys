import { RequestStatus, GetStockExchangeStatus } from '../../../../utils/consts';
import get from 'get-value';

const actions = store => ({
  updateTickers(state, e) {
    store.setState({
      tickers: e.target.value
    });
  },
  async getStockExchangeSetting(state) {
    store.setState({
      stockexchangeGetSettingsStatus: GetStockExchangeStatus.Getting
    });

    let tickers = '^FCHI';

    store.setState({
      tickers,
    });

    try {
      const { value: ticker } = await state.httpClient.get('/api/v1/service/stockexchange/variable/STOCKEXCHANGE_TICKERS', {
        userRelated: true
      });
      tickers = ticker;

      store.setState({
        stockexchangeGetSettingsStatus: GetStockExchangeStatus.Success
      });
    } catch (e) {
      store.setState({
        stockexchangeGetSettingsStatus: GetStockExchangeStatus.Error
      });
    }

    store.setState({
      tickers,
    });
  },


  async saveStockExchangeSettings(state) {
    store.setState({
      stockexchangeGetSettingsStatus: GetStockExchangeStatus.Getting
    });
    try {
      // save caldav host
      await state.httpClient.post('/api/v1/service/stockexchange/variable/STOCKEXCHANGE_TICKERS', {
        value: state.tickers,
        userRelated: true
      });
      console.log(state.tickers);
      // start service
      await state.httpClient.post('/api/v1/service/stock-exchange/start');


      store.setState({
        stockexchangeGetSettingsStatus: GetStockExchangeStatus.Success
      });
    } catch (e) {
      const responseMessage = get(e, 'response.data.message');
      if (responseMessage) {
          store.setState({
          stockexchangeGetSettingsStatus: GetStockExchangeStatus.Error
        });
      }
    }
  },

});

export default actions;
