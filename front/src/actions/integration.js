import get from 'get-value';
import update from 'immutability-helper';

import { USER_ROLE } from '../../../server/utils/constants';
import { integrations, integrationsByType, categories } from '../config/integrations';

const HIDDEN_CATEGORIES_FOR_NON_ADMIN_USERS = ['device', 'weather'];

const actions = store => ({
  async getIntegrations(state, intl, category, searchKeyword = '', orderDir = 'asc') {
    const { user = {} } = state;

    // Load all or category related integrations
    let selectedIntegrations = category ? integrationsByType[category] || [] : integrations;
    // Load all categories
    let integrationCategories = categories;
    // Total size
    let totalSize = integrations.length;

    // Filter integrations and categories according to user role
    if (user.role !== USER_ROLE.ADMIN) {
      selectedIntegrations = selectedIntegrations.filter(
        i => HIDDEN_CATEGORIES_FOR_NON_ADMIN_USERS.indexOf(i.type) === -1
      );

      integrationCategories = integrationCategories.filter(
        i => HIDDEN_CATEGORIES_FOR_NON_ADMIN_USERS.indexOf(i.type) === -1
      );

      totalSize = integrations.filter(i => HIDDEN_CATEGORIES_FOR_NON_ADMIN_USERS.indexOf(i.type) === -1).length;
    }

    // Translate with i18n
    selectedIntegrations = selectedIntegrations.map(integration => {
      const name = get(intl.dictionary, `integration.${integration.key}.title`, { default: integration.key });
      const description = get(intl.dictionary, `integration.${integration.key}.description`, {
        default: ''
      });
      return { ...integration, name, description };
    });

    // Filter
    if (searchKeyword && searchKeyword.length > 0) {
      const lowerCaseSearchKeyword = searchKeyword.toLowerCase();
      selectedIntegrations = selectedIntegrations.filter(integration => {
        const { name, description } = integration;
        return (
          name.toLowerCase().includes(lowerCaseSearchKeyword) ||
          description.toLowerCase().includes(lowerCaseSearchKeyword)
        );
      });
    }

    // Sort
    if (orderDir === 'asc') {
      selectedIntegrations.sort((a, b) => a.name.localeCompare(b.name));
    } else if (orderDir === 'desc') {
      selectedIntegrations.sort((a, b) => b.name.localeCompare(a.name));
    }

    store.setState({
      integrations: selectedIntegrations,
      totalSize,
      integrationCategories,
      searchKeyword,
      orderDir,
      selectedCategory: category
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
      console.error(e);
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
      console.error(e);
    }
  },
  search(state, e, intl) {
    this.getIntegrations(intl, state.selectedCategory, e.target.value, state.orderDir);
  },
  changeOrderDir(state, e, intl) {
    this.getIntegrations(intl, state.selectedCategory, state.searchKeyword, e.target.value);
  }
});

export default actions;
