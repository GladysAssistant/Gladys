import { RequestStatus } from '../../../../utils/consts';
import { MUSIC } from '../../../../../../server/utils/constants';
import { RADIO } from '../../../../../../server/services/radio/lib/utils/radio.constants';

const actions = store => ({
  async getConfig(state) {
    store.setState({
      radioGetStatus: RequestStatus.Getting
    });
    let radioEnableProvider = MUSIC.PROVIDER.STATUS.DISABLED;
    let radioDefaultCountry = 'France';
    let radioDefaultStation = undefined;
    const availableCountryOptions = [];
    try {
      const availableCountry = await state.httpClient.get(`/api/v1/service/${RADIO.SERVICE_NAME}/countries`);
      availableCountry.available_country.forEach(element => {
        availableCountryOptions.push({ label: element, value: element });
      });

      const radioEnableProviderVar = await state.httpClient.get(`/api/v1/music/${RADIO.SERVICE_NAME}`);
      if (radioEnableProviderVar && radioEnableProviderVar.status) {
        radioEnableProvider = radioEnableProviderVar.status;
      }
      const radioDefaultCountryVar = await state.httpClient.get(
        `/api/v1/service/${RADIO.SERVICE_NAME}/variable/${RADIO.DEFAULT_COUNTRY}`
      );
      if (radioDefaultCountryVar && radioDefaultCountryVar.value) {
        radioDefaultCountry = radioDefaultCountryVar.value;
      }
      const radioDefaultStationVar = await state.httpClient.get(
        `/api/v1/service/${RADIO.SERVICE_NAME}/station/default`
      );
      if (radioDefaultStationVar && radioDefaultStationVar.station) {
        radioDefaultStation = radioDefaultStationVar.station;
      }
    } catch (e) {
      console.error('Radio service not configured');
    } finally {
      store.setState({
        radioGetStatus: RequestStatus.Success,
        radioEnableProvider,
        availableCountry: availableCountryOptions,
        radioDefaultCountry: { label: radioDefaultCountry, value: radioDefaultCountry },
        radioDefaultStation
      });

      if (radioDefaultCountry) {
        this.updateCountry({ label: radioDefaultCountry, value: radioDefaultCountry });
      }
    }
  },
  async saveConfig(state, e) {
    e.preventDefault();
    store.setState({
      radioSaveStatus: RequestStatus.Getting
    });
    try {
      // save default foler
      if (state.radioDefaultCountry && state.radioDefaultCountry.value) {
        await state.httpClient.post(`/api/v1/service/${RADIO.SERVICE_NAME}/variable/${RADIO.DEFAULT_COUNTRY}`, {
          value: state.radioDefaultCountry.value.trim()
        });
      }
      if (state.radioDefaultStation && state.radioDefaultStation.value) {
        await state.httpClient.post(`/api/v1/service/${RADIO.SERVICE_NAME}/variable/${RADIO.DEFAULT_STATION}`, {
          value: state.radioDefaultStation.value.trim()
        });
      }
      // force reload service conf
      await state.httpClient.post(`/api/v1/service/${RADIO.SERVICE_NAME}/start`);
      store.setState({
        radioSaveStatus: RequestStatus.Success,
        radioDefaultCountry: state.radioDefaultCountry,
        radioDefaultStation: state.radioDefaultStation
      });
    } catch (e) {
      store.setState({
        radioSaveStatus: RequestStatus.Error
      });
    }
  },
  async enableRadioProvider(state, newStatus) {
    store.setState({
      radioSaveStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        radioEnableProvider: newStatus
      });

      // save default foler
      await state.httpClient.post(`/api/v1/music/${RADIO.SERVICE_NAME}/${newStatus}`, {
        value: newStatus
      });
      // force reload service conf
      await state.httpClient.post(`/api/v1/service/${RADIO.SERVICE_NAME}/start`);
      store.setState({
        radioSaveStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        radioSaveStatus: RequestStatus.Error
      });
    }
  },
  async updateCountry(state, country) {
    store.setState({
      radioGetStatus: RequestStatus.Getting
    });
    let stationsResponse = {};
    try {
      // get statiosn by country
      stationsResponse = await state.httpClient.get(
        `/api/v1/service/${RADIO.SERVICE_NAME}/stations/${country.value.trim()}`
      );
    } catch (e) {
      console.error('Radio service not configured ', e);
    } finally {
      store.setState({
        radioGetStatus: RequestStatus.Success,
        radioDefaultCountry: country,
        availableStation: stationsResponse.stations
      });
    }
  },
  async updateStation(state, station) {
    store.setState({
      radioGetStatus: RequestStatus.Success,
      radioDefaultStation: station
    });
  }
});

export default actions;
