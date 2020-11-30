import get from 'get-value';
import update from 'immutability-helper';

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
  async getServices(state, podId = null) {
    try {
      const query = {
        pod_id: podId
      };
      const services = await state.httpClient.get(`/api/v1/service`, query);
      services.sort((s1, s2) => s1.name.localeCompare(s2.name));
      store.setState({
        services
      });
    } catch (e) {
      console.log(e);
    }
  },
  async actionOnService(state, serviceName, action, podId = null) {
    const query = {
      pod_id: podId
    };
    const service = await state.httpClient.post(`/api/v1/service/${serviceName}/${action}`, query);

    const serviceIndex = state.services.findIndex(s => s.selector === service.selector);
    const services = update(state.services, {
      $splice: [[serviceIndex, 1, service]]
    });

    store.setState({
      services
    });
  },
  async startService(state, serviceName, podId = null) {
    await this.actionOnService(state, serviceName, 'start', podId);
  },
  async stopService(state, serviceName, podId = null) {
    await this.actionOnService(state, serviceName, 'stop', podId);
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
    } catch (e) {
      console.log(e);
    }
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
