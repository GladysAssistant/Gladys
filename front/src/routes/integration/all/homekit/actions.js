import QRCode from 'qrcode';
import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  async getHomeKitSettings(state) {
    store.setState({
      homekitGetSettingsStatus: RequestStatus.Getting
    });
    try {
      const { value: setupURI } = await state.httpClient.get('/api/v1/service/homekit/variable/HOMEKIT_SETUP_URI');

      QRCode.toDataURL(setupURI, (err, dataUrl) => {
        store.setState({
          homekitSetupDataUrl: dataUrl,
          homekitGetSettingsStatus: RequestStatus.Success
        });
      });
    } catch (e) {
      store.setState({
        homekitGetSettingsStatus: RequestStatus.Error
      });
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
