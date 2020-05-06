const actions = store => {
  const actions = {
    async checkStatus(state) {
      let heatzyStatus = {
        configured: false,
        connected: false
      };
      try {
        heatzyStatus = await state.httpClient.get('/api/v1/service/heatzy/status');
      } finally {
        store.setState({
          heatzyStatusConfigured: heatzyStatus.configured,
          heatzyStatusConnected: heatzyStatus.connected,
          heatzyStatusLoaded: true
        });
      }
    }
  };
  return Object.assign({}, actions);
};

export default actions;
