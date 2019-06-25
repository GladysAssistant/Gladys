import integrationsConfig from '../config/integrations';

const actions = store => ({
  getIntegrations(state) {
    const currentIntegrationCategory = state.currentUrl.split('/').pop();
    const integrations = integrationsConfig[state.user.language][currentIntegrationCategory] || [];
    store.setState({
      integrations,
      totalSize: integrationsConfig[state.user.language].totalSize
    });
  },
  async getIntegrationByName(state, name, podId = null) {
    const query = {
      pod_id: podId
    };
    const currentIntegration = await state.httpClient.get(`/api/v1/service/${name}`, query);
    store.setState({
      currentIntegration
    });
  },
  getIntegrationByCategory(state, category) {
    const integrations = integrationsConfig[state.user.language][category] || [];
    store.setState({
      integrations
    });
  },
  search(state, e) {
    if (!e.target.value || e.target.value === '') {
      return store.setState({
        integrationsFiltered: null
      });
    }
    store.setState({
      integrationsFiltered: state.integrations.filter(integration =>
        integration.name.toLowerCase().includes(e.target.value.toLowerCase())
      )
    });
  }
});

export default actions;
