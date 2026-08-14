import QRCode from 'qrcode';
import { RequestStatus } from '../../../../utils/consts';

const EXPOSURE_MODES = {
  ALL: 'all',
  SELECTION: 'selection',
};

const actions = (store) => ({
  async getHomeKitSettings(state) {
    store.setState({
      homekitGetSettingsStatus: RequestStatus.Getting,
    });
    try {
      let homekitMdnsAdvertiser = 'bonjour-hap';
      let homekitExposureMode = EXPOSURE_MODES.ALL;
      let homekitExposedDevices = [];

      const { value: setupURI } = await state.httpClient.get('/api/v1/service/homekit/variable/HOMEKIT_SETUP_URI');
      try {
        ({ value: homekitMdnsAdvertiser } = await state.httpClient.get(
          '/api/v1/service/homekit/variable/HOMEKIT_MDNS_ADVERTISER',
        ));
      } catch (e) {
        // Variable not set yet
      }
      try {
        ({ value: homekitExposureMode } = await state.httpClient.get(
          '/api/v1/service/homekit/variable/HOMEKIT_EXPOSURE_MODE',
        ));
      } catch (e) {
        // Variable not set yet: the bridge exposes every compatible device
      }
      try {
        const { value } = await state.httpClient.get('/api/v1/service/homekit/variable/HOMEKIT_EXPOSED_DEVICES');
        homekitExposedDevices = JSON.parse(value);
      } catch (e) {
        // Variable not set yet, or unreadable
      }
      let homekitCompatibleDevices = [];
      try {
        homekitCompatibleDevices = await state.httpClient.get('/api/v1/service/homekit/device');
      } catch (e) {
        // The device list only feeds the selection screen. Failing to read it must not take down
        // the pairing QR code with it.
      }

      QRCode.toDataURL(setupURI, (err, dataUrl) => {
        store.setState({
          homekitSetupDataUrl: dataUrl,
          homekitMdnsAdvertiser,
          homekitExposureMode:
            homekitExposureMode === EXPOSURE_MODES.SELECTION ? homekitExposureMode : EXPOSURE_MODES.ALL,
          homekitExposedDevices: Array.isArray(homekitExposedDevices) ? homekitExposedDevices : [],
          homekitCompatibleDevices,
          homekitGetSettingsStatus: RequestStatus.Success,
        });
      });
    } catch (e) {
      store.setState({
        homekitGetSettingsStatus: RequestStatus.Error,
      });
    }
  },
  updateExposureMode(state, e) {
    store.setState({
      homekitExposureMode: e.target.value,
    });
  },
  updateExposedDevices(state, selectedOptions) {
    store.setState({
      homekitExposedDevices: (selectedOptions || []).map((option) => option.value),
    });
  },
  async saveExposure(state, e) {
    e.preventDefault();
    store.setState({ homekitSaveExposureStatus: RequestStatus.Getting });
    try {
      // The list is written before the mode: if the second write fails, the bridge keeps exposing
      // everything, which is the safe outcome. The other order would leave it in selection mode
      // with a stale list, and silently drop devices the user never removed.
      await state.httpClient.post('/api/v1/service/homekit/variable/HOMEKIT_EXPOSED_DEVICES', {
        value: JSON.stringify(state.homekitExposedDevices),
      });
      await state.httpClient.post('/api/v1/service/homekit/variable/HOMEKIT_EXPOSURE_MODE', {
        value: state.homekitExposureMode,
      });
      // Rebuild the bridge with the new device list, keeping the existing pairing
      await state.httpClient.get('/api/v1/service/homekit/reload');
      store.setState({ homekitSaveExposureStatus: RequestStatus.Success });
    } catch (e) {
      store.setState({ homekitSaveExposureStatus: RequestStatus.Error });
    }
  },
  updateMDNSAdvertiser(state, e) {
    store.setState({
      homekitMdnsAdvertiser: e.target.value,
    });
  },
  async saveMDNSAdvertiser(state, e) {
    e.preventDefault();
    store.setState({ homekitSaveMDNSStatus: RequestStatus.Getting });
    try {
      await state.httpClient.post('/api/v1/service/homekit/variable/HOMEKIT_MDNS_ADVERTISER', {
        value: state.homekitMdnsAdvertiser,
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
      homekitReloadStatus: RequestStatus.Getting,
    });
    try {
      await state.httpClient.get('/api/v1/service/homekit/reload');
      store.setState({
        homekitReloadStatus: RequestStatus.Success,
      });
    } catch (e) {
      store.setState({
        homekitReloadStatus: RequestStatus.Error,
      });
    }
  },
  async resetBridge(state, e) {
    e.preventDefault();
    store.setState({
      homekitResetStatus: RequestStatus.Getting,
    });
    try {
      await state.httpClient.get('/api/v1/service/homekit/reset');

      const { value: setupURI } = await state.httpClient.get('/api/v1/service/homekit/variable/HOMEKIT_SETUP_URI');
      QRCode.toDataURL(setupURI, (err, dataUrl) => {
        store.setState({
          homekitSetupDataUrl: dataUrl,
          homekitResetStatus: RequestStatus.Success,
        });
      });
    } catch (e) {
      store.setState({
        homekitResetStatus: RequestStatus.Error,
      });
    }
  },
});

export { EXPOSURE_MODES };
export default actions;
