import get from 'get-value';
import { integrations, integrationsByType, categories } from '../config/integrations';

const actions = store => ({
  getIntegrations(state, category = null) {
    const selectedIntegrations = integrationsByType[category] || integrations;
    store.setState({
      integrations: selectedIntegrations,
      totalSize: selectedIntegrations.length,
      integrationCategories: categories,
      searchKeyword: ''
    });
  },
  async getIntegrationByName(state, name, podId = null) {
    try {
      const query = {
        pod_id: podId
      };
      const currentIntegration = await state.httpClient.get(`/api/v1/service/${name}`, query);
      store.setState({
        currentIntegration
      });
    } catch (e) {}
  },
  getIntegrationByCategory(state, category) {
    const selectedIntegrations = category ? integrationsByType[category] || [] : integrations;
    store.setState({
      integrations: selectedIntegrations,
      searchKeyword: ''
    });
  },
  search(state, e, intl) {
    if (!e.target.value || e.target.value === '') {
      this.getIntegrationByCategory(state.category);
    } else {
      const keyword = e.target.value.toLowerCase();
      store.setState({
        integrations: state.integrations.filter(integration => {
          const name = get(intl.dictionary, `integration.${integration.key}.title`, { default: '' });
          const description = get(intl.dictionary, `integration.${integration.key}.description`, { default: '' });
          return name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword);
        }),
        searchKeyword: keyword
      });
    }
  }
});

export default actions;
