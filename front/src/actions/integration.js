import get from 'get-value';
import integrationsConfig from '../config/integrations';
import { AVAILABLE_LANGUAGES_LIST, AVAILABLE_LANGUAGES } from '../../../server/utils/constants';

const getLanguage = state => {
  const foundLanguageInState = get(state, 'user.language');
  const userLanguage =
    AVAILABLE_LANGUAGES_LIST.indexOf(foundLanguageInState) !== -1 ? foundLanguageInState : AVAILABLE_LANGUAGES.EN;
  return userLanguage;
};

const actions = store => ({
  getIntegrations(state) {
    const userLanguage = getLanguage(state);
    const currentIntegrationCategory = state.currentUrl.split('/').pop();
    const integrations = integrationsConfig[userLanguage][currentIntegrationCategory] || [];
    store.setState({
      integrations,
      totalSize: integrationsConfig[userLanguage].totalSize
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
    } catch (e) {
      console.log(e);
    }
  },
  getIntegrationByCategory(state, category) {
    const userLanguage = getLanguage(state);
    const integrations = integrationsConfig[userLanguage][category] || [];
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
