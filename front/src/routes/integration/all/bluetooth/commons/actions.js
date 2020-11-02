const createActions = store => {
  const actions = {
    async getStatus(state) {
      let bluetoothStatus = {
        ready: false
      };
      try {
        bluetoothStatus = await state.httpClient.get('/api/v1/service/bluetooth/status');
      } finally {
        store.setState({
          bluetoothStatus
        });
      }
    },
    async updateStatus(state, bluetoothStatus = { ready: false }) {
      store.setState({
        bluetoothStatus
      });
    },
    async scan(state, selector) {
      const useSelector = typeof selector === 'string';
      let action;
      if (state.bluetoothStatus.scanning) {
        action = 'off';
      } else {
        action = 'on';
      }

      let bluetoothStatus = { ...state.bluetoothStatus, scanning: true, peripheralLookup: useSelector };
      store.setState({
        bluetoothStatus
      });

      try {
        const uri = `/api/v1/service/bluetooth/scan${useSelector ? `/${selector}` : ''}`;
        bluetoothStatus = await state.httpClient.post(uri, {
          scan: action
        });
      } finally {
        store.setState({
          bluetoothStatus
        });
      }
    }
  };
  return Object.assign({}, actions);
};

export default createActions;
