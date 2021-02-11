import { GetStockExchangeStatus } from '../../../../utils/consts';
import get from 'get-value';
import tickers from './tickers.js';

const actions = store => ({
  async loadProps(state) {
    let stockExchangeTickers;
    let stockExchangeApiKey;
    let selectedOptions = [];

    try {

      stockExchangeApiKey = await state.httpClient.get(
        '/api/v1/service/stock-exchange/variable/STOCKEXCHANGE_API_KEY',
        {
          userRelated: true
        }
      );
      stockExchangeTickers = await state.httpClient.get(
        '/api/v1/service/stock-exchange/variable/STOCKEXCHANGE_TICKERS',
        {
          userRelated: true
        }
      );
    } finally {
      if (stockExchangeTickers) {
        const ids = JSON.parse(stockExchangeTickers.value);
        // Get from all tickers (label/value pair) the selected values (Reminder : values are stored as array (ie ["^FCHI", "GBI"])
        ids.map(id => selectedOptions.push(tickers.find(e => e.value === id)));
      }
      store.setState({
        stockExchangeApiKey: (stockExchangeApiKey || {}).value,
        stockExchangeTickers: (stockExchangeTickers || { value: ['^FCHI'] }).value,
        tickersOptions: tickers,
        selectedTickers: selectedOptions
      });
    }
  },

  updateConfiguration(state, e) {
    const data = [];
    data[e.target.name] = e.target.value;
    store.setState(data);
  },

  onTickersChange(state, e) {
    store.setState({
      selectedTickers: e,
      stockExchangeTickers: ( (JSON.stringify(e.map(ticker => ticker.value) ) )),
    });
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
  }
});

export default actions;
