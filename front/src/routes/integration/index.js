import { Component } from 'preact';
import get from 'get-value';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';

import IntegrationPage from './IntegrationPage';
import withIntlAsProp from '../../utils/withIntlAsProp';
import normalizeSearchText from '../../utils/normalizeSearchText';
import { USER_ROLE, WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';
import debounce from 'debounce';
import { integrations, integrationsByType, categories } from '../../config/integrations';
import { getLocalizedText } from './all/external-integration/utils';
import { getCatalogFilters, getCatalogUrl, getUrlFromCatalog, rememberCatalogUrl } from './catalog-url';
import createActionsExternalIntegrationUpdates from '../../actions/externalIntegrationUpdates';
import { RequestStatus } from '../../utils/consts';

const HIDDEN_CATEGORIES_FOR_NON_ADMIN_USERS = ['device', 'weather'];
const HIDDEN_INTEGRATIONS_FOR_NON_ADMIN_USERS = ['homekit'];
// cross-cutting views: they are not integration types, they filter the whole
// catalog (a favorite, or an integration with a pending update, can be of any
// type) — so no type filter must be applied to them
const VIRTUAL_CATEGORIES = ['favorites', 'updates'];

class Integration extends Component {
  constructor(props) {
    super(props);
    // the filters are read back from the URL: landing here from a "back to
    // integrations" link or with the browser back button restores the view
    const { searchKeyword, orderDir } = getCatalogFilters();
    this.state = {
      integrations: [],
      integrationCategories: [],
      totalSize: 0,
      searchKeyword,
      orderDir
    };
    this.getIntegrationsDebounced = debounce(this.getIntegrations, 300);
  }

  // the filters are given explicitly by the handlers: setState() only schedules
  // a render, the new value is not readable in the state right away
  updateURL(filters = this.state) {
    const { searchKeyword, orderDir } = filters;
    const url = getCatalogUrl({ category: this.props.category, searchKeyword, orderDir });
    // the list is only reloaded 300ms later (the search is debounced): without
    // this, opening an integration in between would send its back link to the
    // previous view, while the browser back button already goes to this one
    rememberCatalogUrl(url);
    // replace and not push: filtering should not fill the browser history
    route(url, true);
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
    if (!httpClient) {
      return;
    }
    // a non-admin user sees the communication integrations already installed
    // (to link their own account, like on the native Telegram service), but
    // never the store: installing is an admin gesture
    const isAdmin = user.role === USER_ROLE.ADMIN;
    const [externalInstalled, externalStoreResponse] = await Promise.all([
      // null and not []: a failed request means "unknown", not "nothing
      // installed". An empty array would be counted as zero integration to
      // update and would clear the header counter on a network hiccup
      httpClient.get('/api/v1/external_integration').catch(() => null),
      isAdmin ? httpClient.get('/api/v1/external_integration/store').catch(() => null) : Promise.resolve(null)
    ]);
    await this.setState({
      externalInstalled,
      externalStore: externalStoreResponse ? externalStoreResponse.integrations : []
    });
    this.getIntegrations();
  }

  // the server caches the store index, so a integration published since the
  // last refresh is invisible until the next periodic one: this forces the
  // re-download instead of making the user wait (or restart Gladys)
  refreshStore = async () => {
    const { user = {}, httpClient } = this.props;
    if (!httpClient || user.role !== USER_ROLE.ADMIN) {
      return;
    }
    await this.setState({ refreshStoreStatus: RequestStatus.Getting, refreshStoreStale: false });
    try {
      const [externalInstalled, externalStoreResponse] = await Promise.all([
        httpClient.get('/api/v1/external_integration'),
        httpClient.post('/api/v1/external_integration/store/refresh')
      ]);
      // an unreachable store is not an error: the server answers with its
      // cached catalog and says so with refreshed: false, so we warn instead
      // of claiming the catalog is up to date
      await this.setState({
        externalInstalled,
        externalStore: externalStoreResponse ? externalStoreResponse.integrations : [],
        refreshStoreStale: !externalStoreResponse || externalStoreResponse.refreshed !== true,
        refreshStoreStatus: RequestStatus.Success
      });
      this.getIntegrations();
    } catch (e) {
      console.error(e);
      await this.setState({ refreshStoreStatus: RequestStatus.Error });
    }
  };

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
    if (prevCategory !== currentCategory) {
      // the category links carry no filter: keep the ones already applied in
      // the URL of the newly displayed category
      this.updateURL();
    }
    if (prevUserId !== currentUserId) {
      this.loadExternalIntegrations();
    }
    // the periodic poll only refreshes the global counter: on a catalog left
    // open, the menu entry and the "to update" list would keep showing the
    // state of the last load while the header already says otherwise
    const sharedCount = this.props.externalIntegrationsToUpdate;
    if (
      prevProps.externalIntegrationsToUpdate !== sharedCount &&
      sharedCount !== this.state.integrationsToUpdate &&
      prevUserId === currentUserId
    ) {
      this.loadExternalIntegrations();
    }
  }

  buildExternalIntegrationCards() {
    const { user = {}, category } = this.props;
    // external integrations live in the category matching their manifest
    // type ("device", "communication" or "weather"), and can also be
    // favorites
    const EXTERNAL_CATEGORIES = ['device', 'communication', 'weather'];
    if (category && !EXTERNAL_CATEGORIES.includes(category) && !VIRTUAL_CATEGORIES.includes(category)) {
      return [];
    }
    const isAdmin = user.role === USER_ROLE.ADMIN;
    const language = user.language || 'en';
    // a non-admin user only sees the installed communication integrations:
    // the device screens and the store are admin-only (the server already
    // returns nothing else, this is the same rule on the display side)
    const installed = (this.state.externalInstalled || []).filter(
      integration => isAdmin || get(integration, 'manifest.type') === 'communication'
    );
    const store = isAdmin ? this.state.externalStore || [] : [];

    const storeBySlug = new Map();
    store.forEach(storeIntegration => {
      if (storeIntegration.store_slug) {
        storeBySlug.set(storeIntegration.store_slug, storeIntegration);
      }
    });
    const installedSlugs = new Set(installed.filter(i => i.store_slug).map(i => i.store_slug));

    const externalCards = [];

    // the manifest declares the channels the integration knows how to use
    // ("local", "cloud", or both): this is the same information the native
    // integrations carry in their JSON config, so the catalog can show the
    // Local/Cloud tags on a community integration too
    const getTransportTags = manifest => {
      const transports = manifest.transports || [];
      return {
        local: transports.includes('local'),
        cloud: transports.includes('cloud')
      };
    };

    // communication and weather integrations have no device screens: their
    // card lands straight on the configuration screen
    const getInstalledUrl = (selector, manifest) =>
      ['communication', 'weather'].includes(manifest.type)
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
        type: ['communication', 'weather'].includes(manifest.type) ? manifest.type : 'device',
        name: manifest.name || integration.name || integration.selector,
        description: getLocalizedText(manifest.description, language),
        url: getInstalledUrl(integration.selector, manifest),
        img: (storeIntegration && storeIntegration.cover_url) || manifest.cover_image || null,
        status: integration.status,
        updateAvailable: integration.update_available,
        ...getTransportTags(manifest)
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
        type: ['communication', 'weather'].includes(manifest.type) ? manifest.type : 'device',
        name: manifest.name || storeIntegration.store_slug,
        description: getLocalizedText(manifest.description, language),
        url: isInstalled
          ? getInstalledUrl(storeIntegration.installed_selector, manifest)
          : // the install page has a "back to integrations" link: it needs to
            // know which catalog, with which filters, the user comes from
            getUrlFromCatalog(`/dashboard/integration/device/external-install/${storeIntegration.store_slug}`, {
              category,
              searchKeyword: this.state.searchKeyword,
              orderDir: this.state.orderDir
            }),
        img: storeIntegration.cover_url || manifest.cover_image || null,
        updateAvailable: isInstalled ? storeIntegration.update_available : false,
        ...getTransportTags(manifest)
      });
    });

    // the favorites and updates views keep every type, their own filter
    // comes later
    if (category && !VIRTUAL_CATEGORIES.includes(category)) {
      return externalCards.filter(card => card.type === category);
    }
    return externalCards;
  }

  async getIntegrations() {
    const { user = {}, intl, category } = this.props;
    const { searchKeyword = '', orderDir = 'asc' } = this.state;

    // Load all or category related integrations
    let selectedIntegrations =
      category && !VIRTUAL_CATEGORIES.includes(category) ? integrationsByType[category] || [] : integrations;
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

    // If we are in updates view, only display the integrations to update
    if (category === 'updates') {
      selectedIntegrations = selectedIntegrations.filter(integration => integration.updateAvailable);
      totalSize = selectedIntegrations.length;
    }

    // Filter
    if (searchKeyword && searchKeyword.length > 0) {
      // both sides are stripped of their accents: "meteo" has to find "Météo",
      // and typing "Météo" has to keep finding it
      const normalizedSearchKeyword = normalizeSearchText(searchKeyword);
      // a keyword made of accents only folds down to nothing, and every string
      // contains the empty string: without this, such a search would display
      // the whole catalog as if the field were empty
      selectedIntegrations = normalizedSearchKeyword.length
        ? selectedIntegrations.filter(integration => {
            const { name, description } = integration;
            return (
              normalizeSearchText(name).includes(normalizedSearchKeyword) ||
              normalizeSearchText(description).includes(normalizedSearchKeyword)
            );
          })
        : [];
    }

    // Sort
    if (orderDir === 'asc') {
      selectedIntegrations.sort((a, b) => a.name.localeCompare(b.name));
    } else if (orderDir === 'desc') {
      selectedIntegrations.sort((a, b) => b.name.localeCompare(a.name));
    }

    // the counter is computed from the installed integrations, not from the
    // cards being displayed: it must stay the same in every category
    const integrationsToUpdate = this.countIntegrationsToUpdate();

    // the integration pages send the user back here: this runs on mount and on
    // every filter change, so the remembered view is always the current one
    rememberCatalogUrl(getCatalogUrl({ category, searchKeyword, orderDir }));

    this.setState({
      integrations: selectedIntegrations,
      totalSize,
      integrationCategories,
      integrationsToUpdate,
      searchKeyword,
      orderDir
    });
  }

  // the header counter is shared by every page, so the catalog refreshes it
  // from the list it just downloaded instead of letting it go stale
  countIntegrationsToUpdate() {
    const { externalInstalled } = this.state;
    if (!externalInstalled) {
      // the installed list is still loading (loadFavorites finishes first and
      // calls getIntegrations on its way): counting 0 here would hide the
      // "to update" menu entry until it lands, while the header keeps showing
      // its count. Falling back on the shared value keeps the two consistent
      return this.props.externalIntegrationsToUpdate || 0;
    }
    const integrationsToUpdate = externalInstalled.filter(integration => integration.update_available).length;
    // compared to the shared value and not to the local one: getIntegrations()
    // runs on every keystroke of the search field, so an unchanged count must
    // not re-render every component reading it — but a fresh fetch that
    // disagrees with the poll has to correct it, otherwise the header stays on
    // a count the catalog no longer shows
    if (
      this.props.setExternalIntegrationsToUpdate &&
      integrationsToUpdate !== this.props.externalIntegrationsToUpdate
    ) {
      this.props.setExternalIntegrationsToUpdate(integrationsToUpdate);
    }
    return integrationsToUpdate;
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
    const searchKeyword = e.target.value;
    await this.setState({ searchKeyword });
    this.updateURL({ searchKeyword, orderDir: this.state.orderDir });
    await this.getIntegrationsDebounced();
  };

  changeOrderDir = async e => {
    const orderDir = e.target.value;
    await this.setState({ orderDir });
    this.updateURL({ searchKeyword: this.state.searchKeyword, orderDir });
    await this.getIntegrations();
  };

  render(props, state) {
    const user = props.user || {};
    // Manual install of a community (external) integration is available to
    // admins whatever the category being displayed, so it is always reachable.
    const showInstallFromGithub = user.role === USER_ROLE.ADMIN;
    // the store catalog is only loaded for admins (and its refresh route is
    // admin-only), so only they get the refresh control
    const showStoreRefresh = user.role === USER_ROLE.ADMIN;
    // Combine props and state for the IntegrationPage
    const combinedProps = {
      ...props,
      ...state,
      showInstallFromGithub,
      showStoreRefresh,
      search: this.search,
      changeOrderDir: this.changeOrderDir,
      toggleFavorite: this.toggleFavorite,
      refreshStore: this.refreshStore
    };

    return <IntegrationPage {...combinedProps} />;
  }
}

export default connect(
  'user,session,httpClient,externalIntegrationsToUpdate',
  createActionsExternalIntegrationUpdates
)(withIntlAsProp(Integration));
