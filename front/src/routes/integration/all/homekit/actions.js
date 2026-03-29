import QRCode from 'qrcode';
import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  async getHomeKitSettings(state) {
    store.setState({
      homekitGetSettingsStatus: RequestStatus.Getting
    });
    try {
      let homekitMdnsAdvertiser = 'bonjour-hap';

      const { value: setupURI } = await state.httpClient.get('/api/v1/service/homekit/variable/HOMEKIT_SETUP_URI');
      try {
        ({ value: homekitMdnsAdvertiser } = await state.httpClient.get(
          '/api/v1/service/homekit/variable/HOMEKIT_MDNS_ADVERTISER'
        ));
      } catch (e) {
        // Variable not set yet
      }
      QRCode.toDataURL(setupURI, (err, dataUrl) => {
        store.setState({
          homekitSetupDataUrl: dataUrl,
          homekitMdnsAdvertiser,
          homekitGetSettingsStatus: RequestStatus.Success
        });
      });
    } catch (e) {
      store.setState({
        homekitGetSettingsStatus: RequestStatus.Error
      });
    }
  },
  updateMDNSAdvertiser(state, e) {
    store.setState({
      homekitMdnsAdvertiser: e.target.value
    });
  },
  async saveMDNSAdvertiser(state, e) {
    e.preventDefault();
    store.setState({ homekitSaveMDNSStatus: RequestStatus.Getting });
    try {
      await state.httpClient.post('/api/v1/service/homekit/variable/HOMEKIT_MDNS_ADVERTISER', {
        value: state.homekitMdnsAdvertiser
      });
      await state.httpClient.get('/api/v1/service/homekit/reload');
      store.setState({ homekitSaveMDNSStatus: RequestStatus.Success });
    } catch (e) {
      store.setState({ homekitSaveMDNSStatus: RequestStatus.Error });
    }
  },
  async refreshBridge(state, e) {
    e.preventDefault();
    store.setState({
      homekitReloadStatus: RequestStatus.Getting
    });
    try {
      await state.httpClient.get('/api/v1/service/homekit/reload');
      store.setState({
        homekitReloadStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        homekitReloadStatus: RequestStatus.Error
      });
    }
  },
  async resetBridge(state, e) {
    e.preventDefault();
    store.setState({
      homekitResetStatus: RequestStatus.Getting
    });
    try {
      await state.httpClient.get('/api/v1/service/homekit/reset');

      const { value: setupURI } = await state.httpClient.get('/api/v1/service/homekit/variable/HOMEKIT_SETUP_URI');
      QRCode.toDataURL(setupURI, (err, dataUrl) => {
        store.setState({
          homekitSetupDataUrl: dataUrl,
          homekitResetStatus: RequestStatus.Success
        });
      });
    } catch (e) {
      store.setState({
        homekitResetStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
