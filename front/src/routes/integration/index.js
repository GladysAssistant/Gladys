import { Component } from 'preact';
import get from 'get-value';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';

import IntegrationPage from './IntegrationPage';
import withIntlAsProp from '../../utils/withIntlAsProp';
import normalizeSearchText from '../../utils/normalizeSearchText';
import { SERVICE_STATUS, USER_ROLE, WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';
import debounce from 'debounce';
import { integrations, catalogCategories } from '../../config/integrations';
import { getLocalizedText, isConfigOnlyIntegrationType } from './all/external-integration/utils';
import { getCatalogFilters, getCatalogUrl, getUrlFromCatalog, rememberCatalogUrl } from './catalog-url';
import createActionsExternalIntegrationUpdates from '../../actions/externalIntegrationUpdates';
import { RequestStatus } from '../../utils/consts';

// the role rules stay expressed on the technical `type` (spec §2.2): the
// browse categories are display metadata and play no part in visibility
const HIDDEN_TYPES_FOR_NON_ADMIN_USERS = ['device', 'weather', 'tts'];
const HIDDEN_INTEGRATIONS_FOR_NON_ADMIN_USERS = ['homekit'];
// cross-cutting views: they are not browse categories, they filter the whole
// catalog (a favorite, or an integration with a pending update, can be of any
// category) — so no category filter must be applied to them
const VIRTUAL_CATEGORIES = ['favorites', 'updates', 'installed'];
// a category earns its sidebar entry with enough visible integrations
// (spec §5): below the bar it stays routable by URL and its integrations
// remain reachable through "All", the search and the favorites
const SIDEBAR_CATEGORY_MIN_INTEGRATIONS = 3;
const KNOWN_CATEGORY_KEYS = new Set(catalogCategories.map(category => category.key));
// a store integration is flagged as new during its first weeks in the index
const NEW_BADGE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// missing or malformed date = "always been there": those cards sink to the
// bottom of the "Newest first" sort and never wear the New badge
const getFirstSeenTimestamp = card => {
  const timestamp = card.firstSeenAt ? Date.parse(card.firstSeenAt) : NaN;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

// Breakdown of the live states of the installed community integrations
// ({ RUNNING: 3, ERROR: 1 }), feeding the summary of the "Installed" view.
// An installed integration whose status is not known yet is counted as
// UNKNOWN — a state of the supervisor's model — rather than dropped: the
// total of the breakdown must always match the number of installed cards.
const countInstalledByStatus = installedIntegrations => {
  const counts = {};
  installedIntegrations.forEach(integration => {
    const status = integration.status || SERVICE_STATUS.UNKNOWN;
    counts[status] = (counts[status] || 0) + 1;
  });
  return counts;
};

class Integration extends Component {
  constructor(props) {
    super(props);
    // the filters are read back from the URL: landing here from a "back to
    // integrations" link or with the browser back button restores the view
    const { searchKeyword, orderDir, origin, transports, gladysPlus } = getCatalogFilters();
    this.state = {
      integrations: [],
      integrationCategories: [],
      totalSize: 0,
      searchKeyword,
      orderDir,
      origin,
      transports,
      gladysPlus
    };
    this.getIntegrationsDebounced = debounce(this.getIntegrations, 300);
  }

  // the filters changed by a handler are given explicitly and merged over the
  // state: setState() only schedules a render, the new value is not readable
  // in the state right away
  updateURL(filters = {}) {
    const { searchKeyword, orderDir, origin, transports, gladysPlus } = { ...this.state, ...filters };
    const url = getCatalogUrl({
      category: this.props.category,
      searchKeyword,
      orderDir,
      origin,
      transports,
      gladysPlus
    });
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
    const [externalInstalledResponse, externalStoreResponse] = await Promise.all([
      // null and not []: a failed request means "unknown", not "nothing
      // installed". An empty array would be counted as zero integration to
      // update and would clear the header counter on a network hiccup
      httpClient.get('/api/v1/external_integration').catch(() => null),
      isAdmin ? httpClient.get('/api/v1/external_integration/store').catch(() => null) : Promise.resolve(null)
    ]);
    await this.setState({
      // this list is reloaded on a user change and whenever the shared "to
      // update" counter moves: a failed reload must not erase what we already
      // know, or a network hiccup would make the installed cards, their menu
      // entry and their inventory count blink out until the next reload
      externalInstalled: externalInstalledResponse || this.state.externalInstalled || null,
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
    // technical types an external integration card can carry: the manifest
    // type when the front knows it, "device" as the fallback
    const EXTERNAL_CATEGORIES = ['device', 'communication', 'weather', 'tts'];
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

    // browse categories of a community card: the index entry computed by the
    // indexer wins (manifest field or fallback mapping, already filtered by
    // the server), then the manifest of a dev install — where keys published
    // with a newer vocabulary than this front are dropped, never a reason to
    // hide the card (spec §6.2)
    const getCardCategories = (manifest, storeIntegration) => {
      if (storeIntegration && Array.isArray(storeIntegration.categories)) {
        return storeIntegration.categories;
      }
      const manifestCategories = Array.isArray(manifest.categories) ? manifest.categories : [];
      return manifestCategories.filter(key => KNOWN_CATEGORY_KEYS.has(key));
    };

    // a communication, weather or tts integration has no device screens: its
    // card lands straight on the configuration screen
    const getInstalledUrl = (selector, manifest) =>
      isConfigOnlyIntegrationType(manifest.type)
        ? `/dashboard/integration/device/external/${selector}/config`
        : `/dashboard/integration/device/external/${selector}`;
    // the card category is the manifest type, "device" as the fallback
    const getCardType = manifest => (EXTERNAL_CATEGORIES.includes(manifest.type) ? manifest.type : 'device');

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
        type: getCardType(manifest),
        name: manifest.name || integration.name || integration.selector,
        description: getLocalizedText(manifest.description, language),
        url: getInstalledUrl(integration.selector, manifest),
        img: (storeIntegration && storeIntegration.cover_url) || manifest.cover_image || null,
        status: integration.status,
        updateAvailable: integration.update_available,
        categories: getCardCategories(manifest, storeIntegration),
        firstSeenAt: (storeIntegration && storeIntegration.first_seen_at) || null,
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
        type: getCardType(manifest),
        name: manifest.name || storeIntegration.store_slug,
        description: getLocalizedText(manifest.description, language),
        url: isInstalled
          ? getInstalledUrl(storeIntegration.installed_selector, manifest)
          : // the install page has a "back to integrations" link: it needs to
            // know which catalog, with which filters, the user comes from
            getUrlFromCatalog(`/dashboard/integration/device/external-install/${storeIntegration.store_slug}`, {
              category,
              searchKeyword: this.state.searchKeyword,
              orderDir: this.state.orderDir,
              origin: this.state.origin,
              transports: this.state.transports,
              gladysPlus: this.state.gladysPlus
            }),
        img: storeIntegration.cover_url || manifest.cover_image || null,
        updateAvailable: isInstalled ? storeIntegration.update_available : false,
        categories: getCardCategories(manifest, storeIntegration),
        firstSeenAt: storeIntegration.first_seen_at || null,
        ...getTransportTags(manifest)
      });
    });

    // no view filter here: the sidebar needs the whole visible catalog to
    // compute its category counts, the current view is carved out later
    return externalCards;
  }

  async getIntegrations() {
    const { user = {}, intl, category } = this.props;
    const { searchKeyword = '', orderDir = 'asc', origin = null, transports = [], gladysPlus = false } = this.state;

    // Filter integrations according to user role
    let nativeIntegrations = integrations;
    if (user.role !== USER_ROLE.ADMIN) {
      nativeIntegrations = nativeIntegrations.filter(
        i =>
          HIDDEN_TYPES_FOR_NON_ADMIN_USERS.indexOf(i.type) === -1 &&
          HIDDEN_INTEGRATIONS_FOR_NON_ADMIN_USERS.indexOf(i.key) === -1
      );
    }

    // Get favorites (use cached state if available, otherwise empty)
    const favorites = this.state.favorites || [];

    // Add favorite status and translate with i18n
    nativeIntegrations = nativeIntegrations.map(integration => {
      const name = get(intl.dictionary, `integration.${integration.key}.title`, { default: integration.key });
      const description = get(intl.dictionary, `integration.${integration.key}.description`, {
        default: ''
      });
      const url = `/dashboard/integration/${integration.type}/${get(integration, 'link', {
        default: integration.key
      }).toLowerCase()}`;
      return { ...integration, name, description, url, isFavorite: favorites.includes(integration.key) };
    });

    // Merge external integrations (community integrations running in isolated
    // Docker containers), after the i18n pass (their name comes from the
    // manifest) and before the favorites filter so they can be favorites too
    const externalCards = this.buildExternalIntegrationCards().map(card => ({
      ...card,
      isFavorite: favorites.includes(card.key)
    }));
    const now = Date.now();
    // the whole catalog visible to this user, whatever the current view: the
    // sidebar categories are computed from it, not from the displayed subset
    const catalog = nativeIntegrations.concat(externalCards).map(card => ({
      ...card,
      categories: card.categories || [],
      isNew: getFirstSeenTimestamp(card) > 0 && now - getFirstSeenTimestamp(card) < NEW_BADGE_MAX_AGE_MS
    }));

    // a category earns its sidebar entry with enough visible integrations
    // (spec §5). Like the "Updates" entry, the category being displayed stays
    // visible below the bar, so the menu never loses the current view
    const integrationCategories = catalogCategories.filter(
      ({ key }) =>
        key === category ||
        catalog.filter(integration => integration.categories.includes(key)).length >= SIDEBAR_CATEGORY_MIN_INTEGRATIONS
    );

    let selectedIntegrations = catalog;

    // Filter on the browse category of the view
    if (category && !VIRTUAL_CATEGORIES.includes(category)) {
      selectedIntegrations = selectedIntegrations.filter(integration => integration.categories.includes(category));
    }

    // If we are in favorites view, only display favorites
    if (category === 'favorites') {
      selectedIntegrations = selectedIntegrations.filter(integration => integration.isFavorite);
    }

    // If we are in updates view, only display the integrations to update
    if (category === 'updates') {
      selectedIntegrations = selectedIntegrations.filter(integration => integration.updateAvailable);
    }

    // If we are in the installed view, only display what actually runs on this
    // instance: the community integrations installed here. Native integrations
    // ship with Gladys and are never "installed on the instance", so they have
    // no place in this inventory
    if (category === 'installed') {
      selectedIntegrations = selectedIntegrations.filter(integration => integration.externalInstalled);
    }

    // the facets (spec §4) are technical attributes, orthogonal to the browse
    // categories: cumulative filters that define the view, like the category
    if (origin === 'native') {
      selectedIntegrations = selectedIntegrations.filter(integration => !integration.external);
    } else if (origin === 'community') {
      selectedIntegrations = selectedIntegrations.filter(integration => integration.external);
    }
    // multi-valued transport facet (spec §4 normalization): both chips
    // selected is a union — "declares local OR cloud" — which still excludes
    // the integrations with no declared transport
    if (transports.length > 0) {
      selectedIntegrations = selectedIntegrations.filter(integration => transports.some(value => integration[value]));
    }
    if (gladysPlus) {
      selectedIntegrations = selectedIntegrations.filter(integration => integration.gladysPlus);
    }

    // the total is the size of the view the user is currently looking at, once
    // every filter that defines this view has been applied (role, category,
    // favorites, updates) but before the search: it is the reference the search
    // result count is compared to. Computing it any earlier would mix scopes,
    // e.g. counting the integrations of every type while displaying only one
    const totalSize = selectedIntegrations.length;

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
    } else if (orderDir === 'newest') {
      // the store index says when each community integration was first seen;
      // everything without the date (the natives, an older index) sinks below
      // as an undated block. Ties fall back to the name, then to the stable
      // key, so the order never shuffles across catalog refreshes (spec §4)
      selectedIntegrations.sort(
        (a, b) =>
          getFirstSeenTimestamp(b) - getFirstSeenTimestamp(a) ||
          a.name.localeCompare(b.name) ||
          a.key.localeCompare(b.key)
      );
    }

    // the counter is computed from the installed integrations, not from the
    // cards being displayed: it must stay the same in every category
    const integrationsToUpdate = this.countIntegrationsToUpdate();

    // same rule for the inventory of what runs on this instance: it is read
    // from the whole catalog visible to this user, so the menu entry and the
    // summary keep saying the same thing whatever category, facet or search
    // is currently applied
    const installedIntegrations = catalog.filter(integration => integration.externalInstalled);

    // an inventory of zero only means "nothing is installed" once the list has
    // actually been downloaded: while it is loading, or after a failed fetch,
    // the count is unknown and the view must not claim the instance is empty
    const installedInventoryKnown = !!this.state.externalInstalled;

    // the integration pages send the user back here: this runs on mount and on
    // every filter change, so the remembered view is always the current one
    rememberCatalogUrl(getCatalogUrl({ category, searchKeyword, orderDir, origin, transports, gladysPlus }));

    this.setState({
      integrations: selectedIntegrations,
      totalSize,
      integrationCategories,
      integrationsToUpdate,
      installedIntegrationsCount: installedIntegrations.length,
      installedStatusCounts: countInstalledByStatus(installedIntegrations),
      installedInventoryKnown,
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
    this.updateURL({ searchKeyword });
    await this.getIntegrationsDebounced();
  };

  changeOrderDir = async e => {
    const orderDir = e.target.value;
    await this.setState({ orderDir });
    this.updateURL({ orderDir });
    await this.getIntegrations();
  };

  // clicking the active chip of a facet group releases the filter
  setOriginFacet = async value => {
    const origin = this.state.origin === value ? null : value;
    await this.setState({ origin });
    this.updateURL({ origin });
    await this.getIntegrations();
  };

  setTransportFacet = async value => {
    const current = this.state.transports || [];
    const transports = current.includes(value) ? current.filter(t => t !== value) : [...current, value];
    await this.setState({ transports });
    this.updateURL({ transports });
    await this.getIntegrations();
  };

  toggleGladysPlusFacet = async () => {
    const gladysPlus = !this.state.gladysPlus;
    await this.setState({ gladysPlus });
    this.updateURL({ gladysPlus });
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
      refreshStore: this.refreshStore,
      setOriginFacet: this.setOriginFacet,
      setTransportFacet: this.setTransportFacet,
      toggleGladysPlusFacet: this.toggleGladysPlusFacet
    };

    return <IntegrationPage {...combinedProps} />;
  }
}

export default connect(
  'user,session,httpClient,externalIntegrationsToUpdate',
  createActionsExternalIntegrationUpdates
)(withIntlAsProp(Integration));
