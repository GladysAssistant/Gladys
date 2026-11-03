import QRCode from 'qrcode';
import { RequestStatus } from '../../../../utils/consts';

const EXPOSURE_MODES = {
  ALL: 'all',
  SELECTION: 'selection'
};

const formOf = status => ({
  exposureMode: status.exposureMode,
  exposedDevices: status.exposedDevices
});

const qrCodeOf = async status => (status.qrPairingCode ? QRCode.toDataURL(status.qrPairingCode) : null);

// Turning the bridge on starts a Matter node and exposes the devices: the status that comes back
// already carries the pairing code, or the reason the bridge could not start.
const setEnabled = async (store, state, action) => {
  store.setState({ matterBridgeToggleStatus: RequestStatus.Getting });
  try {
    const status = await state.httpClient.post(`/api/v1/service/matter-bridge/${action}`);
    store.setState({
      matterBridgeStatus: status,
      matterBridgeQrCode: await qrCodeOf(status),
      matterBridgeToggleStatus: RequestStatus.Success
    });
  } catch (e) {
    store.setState({ matterBridgeToggleStatus: RequestStatus.Error });
  }
};

const actions = store => ({
  async getMatterBridge(state) {
    store.setState({ matterBridgeGetStatus: RequestStatus.Getting });
    try {
      const status = await state.httpClient.get('/api/v1/service/matter-bridge/status');
      let matterBridgeDevices = [];
      try {
        matterBridgeDevices = await state.httpClient.get('/api/v1/service/matter-bridge/device');
      } catch (e) {
        // The device list only feeds the selection: failing to read it must not hide the pairing code.
      }
      store.setState({
        matterBridgeStatus: status,
        matterBridgeForm: formOf(status),
        matterBridgeDevices,
        matterBridgeQrCode: await qrCodeOf(status),
        matterBridgeGetStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({ matterBridgeGetStatus: RequestStatus.Error });
    }
  },
  async refreshMatterBridgeStatus(state) {
    try {
      const status = await state.httpClient.get('/api/v1/service/matter-bridge/status');
      store.setState({ matterBridgeStatus: status, matterBridgeQrCode: await qrCodeOf(status) });
    } catch (e) {
      // A missed refresh is caught up by the next one.
    }
  },
  async enableMatterBridge(state) {
    await setEnabled(store, state, 'enable');
  },
  async disableMatterBridge(state) {
    await setEnabled(store, state, 'disable');
  },
  updateMatterBridgeExposureMode(state, e) {
    store.setState({ matterBridgeForm: { ...state.matterBridgeForm, exposureMode: e.target.value } });
  },
  updateMatterBridgeExposedDevices(state, selectedOptions) {
    store.setState({
      matterBridgeForm: {
        ...state.matterBridgeForm,
        exposedDevices: (selectedOptions || []).map(option => option.value)
      }
    });
  },
  async saveMatterBridge(state, e) {
    e.preventDefault();
    store.setState({ matterBridgeSaveStatus: RequestStatus.Getting });
    try {
      const status = await state.httpClient.post('/api/v1/service/matter-bridge/config', state.matterBridgeForm);
      store.setState({
        matterBridgeStatus: status,
        matterBridgeForm: formOf(status),
        matterBridgeQrCode: await qrCodeOf(status),
        matterBridgeSaveStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({ matterBridgeSaveStatus: RequestStatus.Error });
    }
  },
  askMatterBridgeReset() {
    store.setState({ matterBridgeConfirmReset: true });
  },
  cancelMatterBridgeReset() {
    store.setState({ matterBridgeConfirmReset: false });
  },
  async resetMatterBridge(state) {
    store.setState({ matterBridgeResetStatus: RequestStatus.Getting, matterBridgeConfirmReset: false });
    try {
      const status = await state.httpClient.post('/api/v1/service/matter-bridge/reset');
      store.setState({
        matterBridgeStatus: status,
        matterBridgeQrCode: await qrCodeOf(status),
        matterBridgeResetStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({ matterBridgeResetStatus: RequestStatus.Error });
    }
  }
});

export { EXPOSURE_MODES };
export default actions;
