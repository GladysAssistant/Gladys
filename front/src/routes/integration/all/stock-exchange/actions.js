import { RequestStatus, GetStockExchangeStatus } from '../../../../utils/consts';
import get from 'get-value';

const actions = store => ({
  async loadProps(state) {
    let stockExchangeTickers;
    let stockExchangeApiKey;
    try {
      stockExchangeApiKey = await state.httpClient.get('/api/v1/service/stock-exchange/variable/STOCKEXCHANGE_API_KEY', {
        userRelated: true
      });
      stockExchangeTickers = await state.httpClient.get('/api/v1/service/stock-exchange/variable/STOCKEXCHANGE_TICKERS', {
        userRelated: true
      });
    } finally {
      store.setState({
        stockExchangeApiKey: (stockExchangeApiKey || {}).value,
        stockExchangeTickers: (stockExchangeTickers || { value: '^FCHI' }).value,
      });
    }
  },
  updateConfiguration(state, e) {
    const data = {};
    data[e.target.name] = e.target.value;
    store.setState(data);
  },
  async saveConfiguration(state) {
    event.preventDefault();
    store.setState({
      stockexchangeSetSettingsStatus: GetStockExchangeStatus.Getting
    });
    try {
      // save apiKey
      await state.httpClient.post('/api/v1/service/stock-exchange/variable/STOCKEXCHANGE_API_KEY', {
        value: state.stockExchangeApiKey.trim(),
        userRelated: true
      });

      // save tickers
      await state.httpClient.post('/api/v1/service/stock-exchange/variable/STOCKEXCHANGE_TICKERS', {
        value: state.stockExchangeTickers,
        userRelated: true
      });
      await state.httpClient.post('/api/v1/service/stock-exchange/stop');
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
