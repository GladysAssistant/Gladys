import { Component } from 'preact';
import get from 'get-value';
import { connect } from 'unistore/preact';

import IntegrationPage from './IntegrationPage';
import withIntlAsProp from '../../utils/withIntlAsProp';
import { USER_ROLE, WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';
import debounce from 'debounce';
import { integrations, integrationsByType, categories } from '../../config/integrations';
import { getLocalizedText } from './all/external-integration/utils';

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
    this.loadExternalIntegrations();
  }

  componentDidMount() {
    if (this.props.session && this.props.session.dispatcher) {
      this.props.session.dispatcher.addListener(
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.STATUS_CHANGED,
        this.onExternalIntegrationStatusChanged
      );
    }
  }

  componentWillUnmount() {
    if (this.props.session && this.props.session.dispatcher) {
      this.props.session.dispatcher.removeListener(
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.STATUS_CHANGED,
        this.onExternalIntegrationStatusChanged
      );
    }
  }

  onExternalIntegrationStatusChanged = async payload => {
    const { externalInstalled } = this.state;
    if (!payload || !externalInstalled) {
      return;
    }
    const updated = externalInstalled.map(integration =>
      integration.selector === payload.selector ? { ...integration, status: payload.status } : integration
    );
    await this.setState({ externalInstalled: updated });
    this.getIntegrations();
  };

  async loadExternalIntegrations() {
    const { user = {}, httpClient } = this.props;
    if (!httpClient || user.role !== USER_ROLE.ADMIN) {
      return;
    }
    const [externalInstalled, externalStoreResponse] = await Promise.all([
      httpClient.get('/api/v1/external_integration').catch(() => []),
      httpClient.get('/api/v1/external_integration/store').catch(() => null)
    ]);
    await this.setState({
      externalInstalled,
      externalStore: externalStoreResponse ? externalStoreResponse.integrations : []
    });
    this.getIntegrations();
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
    if (prevUserId !== currentUserId) {
      this.loadExternalIntegrations();
    }
  }

  buildExternalIntegrationCards() {
    const { user = {}, category } = this.props;
    // external integrations live in the category matching their manifest
    // type ("device" or "communication"), and can also be favorites
    const EXTERNAL_CATEGORIES = ['device', 'communication'];
    if (
      user.role !== USER_ROLE.ADMIN ||
      (category && !EXTERNAL_CATEGORIES.includes(category) && category !== 'favorites')
    ) {
      return [];
    }
    const language = user.language || 'en';
    const installed = this.state.externalInstalled || [];
    const store = this.state.externalStore || [];

    const storeBySlug = new Map();
    store.forEach(storeIntegration => {
      if (storeIntegration.store_slug) {
        storeBySlug.set(storeIntegration.store_slug, storeIntegration);
      }
    });
    const installedSlugs = new Set(installed.filter(i => i.store_slug).map(i => i.store_slug));

    const externalCards = [];

    // a communication integration has no device screens: its card lands
    // straight on the configuration screen
    const getInstalledUrl = (selector, manifest) =>
      manifest.type === 'communication'
        ? `/dashboard/integration/device/external/${selector}/config`
        : `/dashboard/integration/device/external/${selector}`;

    // Installed external integrations
    installed.forEach(integration => {
      const manifest = integration.manifest || {};
      const storeIntegration = integration.store_slug ? storeBySlug.get(integration.store_slug) : null;
      externalCards.push({
        // the store_slug keeps the favorite when a store integration goes
        // from "available" to "installed" (the card key is the favorite key)
        key: `external-${integration.store_slug || integration.selector}`,
        external: true,
        externalInstalled: true,
        type: manifest.type === 'communication' ? 'communication' : 'device',
        name: manifest.name || integration.name || integration.selector,
        description: getLocalizedText(manifest.description, language),
        url: getInstalledUrl(integration.selector, manifest),
        img: (storeIntegration && storeIntegration.cover_url) || manifest.cover_image || null,
        status: integration.status,
        updateAvailable: integration.update_available
      });
    });

    // External integrations available in the store, not installed locally
    store.forEach(storeIntegration => {
      if (storeIntegration.store_slug && installedSlugs.has(storeIntegration.store_slug)) {
        return;
      }
      const manifest = storeIntegration.manifest || {};
      const isInstalled = storeIntegration.installed && storeIntegration.installed_selector;
      externalCards.push({
        key: `external-${storeIntegration.store_slug}`,
        external: true,
        externalInstalled: !!isInstalled,
        type: manifest.type === 'communication' ? 'communication' : 'device',
        name: manifest.name || storeIntegration.store_slug,
        description: getLocalizedText(manifest.description, language),
        url: isInstalled
          ? getInstalledUrl(storeIntegration.installed_selector, manifest)
          : `/dashboard/integration/device/external-install/${storeIntegration.store_slug}`,
        img: storeIntegration.cover_url || manifest.cover_image || null,
        updateAvailable: isInstalled ? storeIntegration.update_available : false
      });
    });

    // the favorites view keeps every type, the favorite filter comes later
    if (category && category !== 'favorites') {
      return externalCards.filter(card => card.type === category);
    }
    return externalCards;
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

    // Merge external integrations (community integrations running in isolated
    // Docker containers), after the i18n pass (their name comes from the
    // manifest) and before the favorites filter so they can be favorites too
    const externalCards = this.buildExternalIntegrationCards().map(card => ({
      ...card,
      isFavorite: favorites.includes(card.key)
    }));
    selectedIntegrations = selectedIntegrations.concat(externalCards);
    totalSize += externalCards.length;

    // If we are in favorites view, only display favorites
    if (category === 'favorites') {
      selectedIntegrations = selectedIntegrations.filter(integration => integration.isFavorite);
      totalSize = selectedIntegrations.length;
    }

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

  toggleFavorite = async integrationKey => {
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
    const user = props.user || {};
    // Manual install of a community (external) integration is available to
    // admins whatever the category being displayed, so it is always reachable.
    const showInstallFromGithub = user.role === USER_ROLE.ADMIN;
    // Combine props and state for the IntegrationPage
    const combinedProps = {
      ...props,
      ...state,
      showInstallFromGithub,
      search: this.search,
      changeOrderDir: this.changeOrderDir,
      toggleFavorite: this.toggleFavorite
    };

    return <IntegrationPage {...combinedProps} />;
  }
}

export default connect('user,session,httpClient', {})(withIntlAsProp(Integration));
