import { RequestStatus, GetStockExchangeStatus } from '../../../../utils/consts';
import get from 'get-value';

const actions = store => ({
  updateApiKey(state, e) {
    store.setState({
      apiKey: e.target.value
    });
  },
  updateTickers(state, e) {
    store.setState({
      tickers: e.target.value
    });
  },
  async getStockExchangeSetting(state) {
    store.setState({
      stockexchangeGetSettingsStatus: GetStockExchangeStatus.Getting
    });

    let stockExchangeTickers = '^FCHI';
    let stockExchangeApiKey = '';

    store.setState({
      stockExchangeApiKey,
      stockExchangeTickers
    });

    try {

      const { value: apiKey } = await state.httpClient.get('/api/v1/service/stock-exchange/variable/STOCKEXCHANGE_API_KEY', {
        userRelated: true
      });
      stockExchangeApiKey = apiKey;

      const { value: tickers } = await state.httpClient.get('/api/v1/service/stock-exchange/variable/STOCKEXCHANGE_TICKERS', {
        userRelated: true
      });
      stockExchangeTickers = tickers;

      store.setState({
        stockexchangeGetSettingsStatus: GetStockExchangeStatus.Success
      });
    } catch (e) {
      store.setState({
        stockexchangeGetSettingsStatus: GetStockExchangeStatus.Error
      });
    }
    store.setState({
      stockExchangeApiKey,
      stockExchangeTickers
    });
  },

  async saveStockExchangeSettings(state) {
    event.preventDefault();
    store.setState({
      stockexchangeSetSettingsStatus: GetStockExchangeStatus.Getting
    });
    try {
      // save apiKey
      await state.httpClient.post('/api/v1/service/stock-exchange/variable/STOCKEXCHANGE_API_KEY', {
        value: state.apiKey,
        userRelated: true
      });

      // save tickers
      await state.httpClient.post('/api/v1/service/stock-exchange/variable/STOCKEXCHANGE_TICKERS', {
        value: state.tickers,
        userRelated: true
      });
      // start service
      await state.httpClient.post('/api/v1/service/stock-exchange/start');
      store.setState({
        stockexchangeSetSettingsStatus: GetStockExchangeStatus.Success
      });
    } catch (e) {
      const responseMessage = get(e, 'response.data.message');
      if (responseMessage) {
          store.setState({
          stockexchangeSetSettingsStatus: GetStockExchangeStatus.Error
        });
      }
    }
  },

});

export default actions;
