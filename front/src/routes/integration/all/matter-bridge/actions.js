import QRCode from 'qrcode';
import { RequestStatus } from '../../../../utils/consts';

const EXPOSURE_MODES = {
  ALL: 'all',
  SELECTION: 'selection'
};

// Errors of the bridge the page explains with a message of its own: the `ERROR_CODES` of the
// server (server/services/matter-bridge/lib/constants.js).
const ERROR_CODES = {
  PORT_IN_USE: 'port_in_use',
  MATTERBRIDGE_ENABLED: 'matterbridge_enabled'
};

const formOf = status => ({
  exposureMode: status.exposureMode,
  exposedDevices: status.exposedDevices
});

const qrCodeOf = async status => (status.qrPairingCode ? QRCode.toDataURL(status.qrPairingCode) : null);

// Counts the changes made from the page (enable, disable, save, reset): a periodic refresh that
// was sent before one of them carries a stale status, and must not overwrite the one it returned.
let mutations = 0;
const startMutation = () => {
  mutations += 1;
};

// The device list only feeds the selection: failing to read it must not hide the pairing code, but
// it is told apart from an empty list, so the page does not say no device can be exposed.
const loadDevices = async (store, state) => {
  try {
    const matterBridgeDevices = await state.httpClient.get('/api/v1/service/matter-bridge/device');
    store.setState({ matterBridgeDevices, matterBridgeDevicesStatus: RequestStatus.Success });
  } catch (e) {
    store.setState({ matterBridgeDevicesStatus: RequestStatus.Error });
  }
};

// Turning the bridge on starts a Matter node and exposes the devices: the status that comes back
// already carries the pairing code, or the reason the bridge could not start.
const setEnabled = async (store, state, action) => {
  startMutation();
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
      await loadDevices(store, state);
      store.setState({
        matterBridgeStatus: status,
        matterBridgeForm: formOf(status),
        matterBridgeQrCode: await qrCodeOf(status),
        matterBridgeGetStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({ matterBridgeGetStatus: RequestStatus.Error });
    }
  },
  async getMatterBridgeDevices(state) {
    await loadDevices(store, state);
  },
  async refreshMatterBridgeStatus(state) {
    const mutationsBefore = mutations;
    try {
      const status = await state.httpClient.get('/api/v1/service/matter-bridge/status');
      const matterBridgeQrCode = await qrCodeOf(status);
      if (mutationsBefore === mutations) {
        store.setState({ matterBridgeStatus: status, matterBridgeQrCode });
      }
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
    startMutation();
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
    startMutation();
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

export { EXPOSURE_MODES, ERROR_CODES };
export default actions;
