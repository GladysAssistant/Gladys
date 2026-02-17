import { Component } from 'preact';
import get from 'get-value';
import { connect } from 'unistore/preact';

import IntegrationPage from './IntegrationPage';
import withIntlAsProp from '../../utils/withIntlAsProp';
import { USER_ROLE } from '../../../../server/utils/constants';
import debounce from 'debounce';
import { integrations, integrationsByType, categories } from '../../config/integrations';

const HIDDEN_CATEGORIES_FOR_NON_ADMIN_USERS = ['device', 'weather'];
const HIDDEN_INTEGRATIONS_FOR_NON_ADMIN_USERS = ['homekit'];

class Integration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      integrations: [],
      integrationCategories: [],
      totalSize: 0,
      searchKeyword: '',
      orderDir: 'asc'
    };
    this.getIntegrationsDebounced = debounce(this.getIntegrations, 300);
  }

  componentWillMount() {
    this.loadFavorites();
  }

  async loadFavorites() {
    try {
      const { httpClient } = this.props;
      if (httpClient) {
        const result = await httpClient.get('/api/v1/user/variable/INTEGRATION_FAVORITES');
        const favorites = JSON.parse(result.value);
        await this.setState({ favorites });
      }
    } catch (e) {
      // Variable not found = no favorites yet
      await this.setState({ favorites: [] });
    }
    this.getIntegrations();
  }

  componentDidUpdate(prevProps) {
    const prevUserId = get(prevProps, 'user.id');
    const currentUserId = get(this.props, 'user.id');
    const prevCategory = get(prevProps, 'category');
    const currentCategory = get(this.props, 'category');
    if (prevUserId !== currentUserId || prevCategory !== currentCategory) {
      this.getIntegrations();
    }
  }

  async getIntegrations() {
    const { user = {}, intl, category } = this.props;
    const { searchKeyword = '', orderDir = 'asc' } = this.state;

    // Load all or category related integrations
    let selectedIntegrations = category && category !== 'favorites' ? integrationsByType[category] || [] : integrations;
    // Load all categories
    let integrationCategories = categories;
    // Total size
    let totalSize = integrations.length;

    // Filter integrations and categories according to user role
    if (user.role !== USER_ROLE.ADMIN) {
      selectedIntegrations = selectedIntegrations.filter(
        i =>
          HIDDEN_CATEGORIES_FOR_NON_ADMIN_USERS.indexOf(i.type) === -1 &&
          HIDDEN_INTEGRATIONS_FOR_NON_ADMIN_USERS.indexOf(i.key) === -1
      );

      integrationCategories = integrationCategories.filter(
        i => HIDDEN_CATEGORIES_FOR_NON_ADMIN_USERS.indexOf(i.type) === -1
      );

      totalSize = integrations.filter(i => HIDDEN_CATEGORIES_FOR_NON_ADMIN_USERS.indexOf(i.type) === -1).length;
    }

    // Get favorites (use cached state if available, otherwise empty)
    const favorites = this.state.favorites || [];

    // Add favorite status to integrations
    selectedIntegrations = selectedIntegrations.map(integration => ({
      ...integration,
      isFavorite: favorites.includes(integration.key)
    }));

    // If we are in favorites view, only display favorites
    if (category === 'favorites') {
      selectedIntegrations = selectedIntegrations.filter(integration => integration.isFavorite);
      totalSize = selectedIntegrations.length;
    }

    // Translate with i18n
    selectedIntegrations = selectedIntegrations.map(integration => {
      const name = get(intl.dictionary, `integration.${integration.key}.title`, { default: integration.key });
      const description = get(intl.dictionary, `integration.${integration.key}.description`, {
        default: ''
      });
      const url = `/dashboard/integration/${integration.type}/${get(integration, 'link', {
        default: integration.key
      }).toLowerCase()}`;
      return { ...integration, name, description, url };
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

    this.setState({
      integrations: selectedIntegrations,
      totalSize,
      integrationCategories,
      searchKeyword,
      orderDir
    });
  }

  toggleFavorite = async (integrationKey) => {
    const favorites = this.state.favorites || [];
    const newFavorites = favorites.includes(integrationKey)
      ? favorites.filter(key => key !== integrationKey)
      : [...favorites, integrationKey];

    // Update state immediately for responsive UI
    await this.setState({ favorites: newFavorites });
    this.getIntegrations();

    // Persist to backend
    try {
      await this.props.httpClient.post('/api/v1/user/variable/INTEGRATION_FAVORITES', {
        value: JSON.stringify(newFavorites)
      });
    } catch (e) {
      console.error('[integration] Failed to save favorites', e);
    }
  };

  search = async e => {
    await this.setState({
      searchKeyword: e.target.value
    });
    await this.getIntegrationsDebounced();
  };

  changeOrderDir = async e => {
    await this.setState({
      orderDir: e.target.value
    });
    await this.getIntegrations();
  };

  render(props, state) {
    // Combine props and state for the IntegrationPage
    const combinedProps = {
      ...props,
      ...state,
      search: this.search,
      changeOrderDir: this.changeOrderDir,
      toggleFavorite: this.toggleFavorite
    };

    return <IntegrationPage {...combinedProps} />;
  }
}

export default connect('user,httpClient', {})(withIntlAsProp(Integration));
