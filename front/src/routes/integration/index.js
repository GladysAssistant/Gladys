import { Component } from 'preact';
import get from 'get-value';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';

import IntegrationPage from './IntegrationPage';
import withIntlAsProp from '../../utils/withIntlAsProp';
import {
  SERVICE_STATUS,
  SYSTEM_VARIABLE_NAMES,
  USER_ROLE,
  WEBSOCKET_MESSAGE_TYPES
} from '../../../../server/utils/constants';
import debounce from 'debounce';
import { integrations, catalogCategories } from '../../config/integrations';
import { getLocalizedText, TYPES_WITHOUT_DEVICE_SCREENS } from './all/external-integration/utils';
import {
  getCatalogFilters,
  getCatalogUrl,
  getRememberedCatalogPosition,
  getUrlFromCatalog,
  rememberCatalogUrl,
  rememberCatalogVisibleCount,
  rememberSearchFocus
} from './catalog-url';
import { buildSearchIndex, getSearchRank, getSearchTokens } from './catalog-search';
import {
  getBrowserTimezone,
  getCountryFromTimezone,
  getCountrySearchTerms,
  isAvailableInCountry
} from './catalog-country';
import createActionsExternalIntegrationUpdates from '../../actions/externalIntegrationUpdates';
import { RequestStatus } from '../../utils/consts';

// the role rules stay expressed on the technical `type` (spec §2.2): the
// browse categories are display metadata and play no part in visibility
// `provider` (capability-only external integrations) joins device and weather:
// installing is an admin act, the widgets themselves reach every user through
// the dashboard picker. `ai` and `tts` too: the AI provider and the voice
// of the instance are admin choices, and such a provider has no per-user
// surface.
const HIDDEN_TYPES_FOR_NON_ADMIN_USERS = ['device', 'weather', 'provider', 'ai', 'tts'];
// homekit exposes the whole house to a hub; free-mobile is a single global SMS
// account whose page reads service-wide credentials. Neither has anything
// per-user, so a non-admin has no business on those pages.
const HIDDEN_INTEGRATIONS_FOR_NON_ADMIN_USERS = ['homekit', 'free-mobile'];
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
// hundreds of community integrations: the cards are rendered by pages as the
// user scrolls, not all at once (a multiple of the 2 and 3 columns of the grid)
const CATALOG_PAGE_SIZE = 48;

// missing or malformed date = "always been there": those cards sink to the
// bottom of the "Newest first" sort and never wear the New badge
const getFirstSeenTimestamp = card => {
  const timestamp = card.firstSeenAt ? Date.parse(card.firstSeenAt) : NaN;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

// same rule for the "Last updated" sort: the store index carries the date of
// the last push on the repository of each community integration, the natives
// have none and sink below as an undated block
const getUpdatedTimestamp = card => {
  const timestamp = card.updatedAt ? Date.parse(card.updatedAt) : NaN;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

// the repository owner is the author of a community integration: searchable,
// never a filter
const getStoreOwner = storeSlug => (typeof storeSlug === 'string' ? storeSlug.split('/')[0] : '');

// the view the list is computed for: a new one starts back on its first page
// of cards, the same one recomputed keeps the cards already scrolled through
const getCatalogViewKey = ({ category, searchKeyword, orderDir, origin, transports, gladysPlus, allCountries }) =>
  JSON.stringify({ category, searchKeyword, orderDir, origin, transports, gladysPlus, allCountries });

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
    const { searchKeyword, orderDir, origin, transports, gladysPlus, allCountries } = getCatalogFilters();
    const filters = { category: props.category, searchKeyword, orderDir, origin, transports, gladysPlus, allCountries };
    // coming back to the view the user left from a card: the same pages of
    // cards are rendered again, and the list is scrolled back to the same
    // place once the catalog has loaded (componentDidUpdate)
    const rememberedPosition = getRememberedCatalogPosition(getCatalogUrl(filters));
    this.pendingScrollY = rememberedPosition ? rememberedPosition.scrollY : null;
    this.state = {
      integrations: [],
      integrationCategories: [],
      totalSize: 0,
      // the view key of the initial filters: the first list computed for them
      // must keep the remembered page count instead of starting over
      catalogView: getCatalogViewKey(filters),
      visibleCount: rememberedPosition ? rememberedPosition.visibleCount : CATALOG_PAGE_SIZE,
      hiddenByCountry: 0,
      instanceCountry: null,
      // null is a valid final value (no country could be derived): a separate
      // flag says when the derivation is done
      instanceCountryLoaded: false,
      // the user the external lists were last loaded for: until they are, the
      // catalog only knows the native integrations and must not pretend to be
      // complete (see render)
      externalLoadedForUserId: null,
      externalStoreUnavailable: false,
      searchKeyword,
      orderDir,
      origin,
      transports,
      gladysPlus,
      allCountries
    };
    this.getIntegrationsDebounced = debounce(this.getIntegrations, 300);
  }

  // the filters changed by a handler are given explicitly and merged over the
  // state: setState() only schedules a render, the new value is not readable
  // in the state right away
  updateURL(filters = {}) {
    const { searchKeyword, orderDir, origin, transports, gladysPlus, allCountries } = { ...this.state, ...filters };
    // a handler may also change the view (the search leaves the browse
    // category, "clear filters" goes back to the whole catalog)
    const category = filters.category !== undefined ? filters.category : this.props.category;
    const url = getCatalogUrl({
      category,
      searchKeyword,
      orderDir,
      origin,
      transports,
      gladysPlus,
      allCountries
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
    this.loadInstanceCountry();
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
    // a running "Update all" stops after the update in flight: there is no
    // screen left to report on the next ones
    this.unmounted = true;
    if (this.props.session && this.props.session.dispatcher) {
      this.props.session.dispatcher.removeListener(
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.STATUS_CHANGED,
        this.onExternalIntegrationStatusChanged
      );
    }
    // the pages of cards rendered so far, for the way back (catalog-url.js)
    rememberCatalogVisibleCount(this.state.visibleCount);
  }

  // the country of the instance, from the time zone Gladys is configured with
  // (an admin setting, like the store itself), else from the browser's. No
  // country at all is a supported state: nothing is hidden then
  async loadInstanceCountry() {
    const { user = {}, httpClient } = this.props;
    let timezone = null;
    if (httpClient && user.role === USER_ROLE.ADMIN) {
      try {
        const { value } = await httpClient.get(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.TIMEZONE}`);
        timezone = value;
      } catch (e) {
        timezone = null;
      }
    }
    const instanceCountry = getCountryFromTimezone(timezone) || getCountryFromTimezone(getBrowserTimezone());
    await this.setState({ instanceCountry, instanceCountryLoaded: true });
    this.getIntegrations();
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
    const userId = user.id;
    // two cards updated at the same time each reload the list on success: the
    // first reload can answer last, with the flag of the second card still up
    this.externalLoadRequest = (this.externalLoadRequest || 0) + 1;
    const request = this.externalLoadRequest;
    const [externalInstalledResponse, externalStoreResponse] = await Promise.all([
      // null and not []: a failed request means "unknown", not "nothing
      // installed". An empty array would be counted as zero integration to
      // update and would clear the header counter on a network hiccup
      httpClient.get('/api/v1/external_integration').catch(() => null),
      isAdmin ? httpClient.get('/api/v1/external_integration/store').catch(() => null) : Promise.resolve(null)
    ]);
    // the user changed while this load was in flight, or a newer load has
    // started since: that one holds the lists to display, this one must not
    // overwrite them
    if (get(this.props, 'user.id') !== userId || request !== this.externalLoadRequest) {
      return;
    }
    await this.setState({
      // this list is reloaded on a user change and whenever the shared "to
      // update" counter moves: a failed reload must not erase what we already
      // know, or a network hiccup would make the installed cards, their menu
      // entry and their inventory count blink out until the next reload
      externalInstalled: externalInstalledResponse || this.state.externalInstalled || null,
      externalStore: externalStoreResponse ? externalStoreResponse.integrations : [],
      externalLoadedForUserId: userId,
      // the server answers with its cached catalog when the store is down:
      // only a catalog never downloaded (or a failed request) leaves the
      // community integrations out, and the page says so
      externalStoreUnavailable: isAdmin && !this.isStoreCatalogAvailable(externalStoreResponse)
    });
    this.getIntegrations();
  }

  isStoreCatalogAvailable = storeResponse => !!storeResponse && storeResponse.refreshed_at !== null;

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
        externalStoreUnavailable: !this.isStoreCatalogAvailable(externalStoreResponse),
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
      this.dropFinishedUpdates();
    }
    if (prevUserId !== currentUserId) {
      this.loadExternalIntegrations();
      this.loadInstanceCountry();
    }
    this.restoreScrollPosition();
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

  // back from an integration page: once the catalog is complete, the country
  // filter known (it removes cards, so scrolling before it lands would miss
  // the target) and the remembered pages of cards rendered, the list is
  // scrolled back to where the user was. The covers have a fixed ratio, so the
  // layout does not move under the scroll as they load
  restoreScrollPosition() {
    const { user = {} } = this.props;
    const catalogLoading = !user.id || this.state.externalLoadedForUserId !== user.id;
    if (
      this.pendingScrollY === null ||
      catalogLoading ||
      !this.state.instanceCountryLoaded ||
      this.state.integrations.length === 0
    ) {
      return;
    }
    const { pendingScrollY } = this;
    this.pendingScrollY = null;
    window.requestAnimationFrame(() => window.scrollTo(0, pendingScrollY));
  }

  buildExternalIntegrationCards() {
    const { user = {}, category } = this.props;
    const isAdmin = user.role === USER_ROLE.ADMIN;
    const language = user.language || 'en';
    // a non-admin user only sees the installed communication and calendar
    // integrations: the device screens and the store are admin-only (the
    // server already returns nothing else, this is the same rule on the
    // display side)
    const installed = (this.state.externalInstalled || []).filter(
      integration => isAdmin || ['communication', 'calendar'].includes(get(integration, 'manifest.type'))
    );
    const store = isAdmin ? this.state.externalStore || [] : [];
    const updateStates = this.state.updateStates || {};
    // an "Update all" run updates one integration at a time: the card buttons
    // wait for it, or a click would start a second pull alongside it
    const updateLocked = this.state.updateAllStatus === RequestStatus.Getting;

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

    // what the search reads beyond the card (catalog-search.js): every
    // language of the description, the search-only keywords of the manifest,
    // the author — and the countries the integration is declared for, which
    // the country filter reads too
    // An installed card carries the manifest of its running image, which may
    // predate the store listing (or the fallback mapping of the indexer): the
    // lite index entry is read too, like getCardCategories does, so a brand
    // keyword published since still finds the card the user actually has.
    // The countries come first from the entry-level field the indexer
    // resolves (manifest, else its fallback mapping — spec C.6), like the
    // categories, then from the manifests
    const unionOf = (...lists) => Array.from(new Set(lists.flatMap(list => (Array.isArray(list) ? list : []))));
    const getSearchFields = (manifest, storeSlug, storeIntegration) => {
      const storeManifest = (storeIntegration && storeIntegration.manifest) || {};
      return {
        descriptions: Object.values(manifest.description || {}).filter(text => typeof text === 'string'),
        keywords: unionOf(manifest.keywords, storeManifest.keywords),
        author: getStoreOwner(storeSlug),
        countries: unionOf(storeIntegration && storeIntegration.countries, manifest.countries, storeManifest.countries)
      };
    };

    // communication, weather, calendar and provider integrations have no device
    // screens: their card lands straight on the configuration screen
    const getInstalledUrl = (selector, manifest) =>
      TYPES_WITHOUT_DEVICE_SCREENS.includes(manifest.type)
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
        type: TYPES_WITHOUT_DEVICE_SCREENS.includes(manifest.type) ? manifest.type : 'device',
        name: manifest.name || integration.name || integration.selector,
        description: getLocalizedText(manifest.description, language),
        url: getInstalledUrl(integration.selector, manifest),
        img: (storeIntegration && storeIntegration.cover_url) || manifest.cover_image || null,
        status: integration.status,
        selector: integration.selector,
        version: integration.version,
        latestVersion: integration.latest_version,
        updateAvailable: integration.update_available,
        updateState: updateStates[integration.selector],
        updateLocked,
        categories: getCardCategories(manifest, storeIntegration),
        firstSeenAt: (storeIntegration && storeIntegration.first_seen_at) || null,
        updatedAt: get(storeIntegration, 'github.pushed_at') || null,
        ...getSearchFields(manifest, integration.store_slug, storeIntegration),
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
        type: TYPES_WITHOUT_DEVICE_SCREENS.includes(manifest.type) ? manifest.type : 'device',
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
              gladysPlus: this.state.gladysPlus,
              allCountries: this.state.allCountries
            }),
        img: storeIntegration.cover_url || manifest.cover_image || null,
        selector: isInstalled ? storeIntegration.installed_selector : null,
        updateAvailable: isInstalled ? storeIntegration.update_available : false,
        updateState: isInstalled ? updateStates[storeIntegration.installed_selector] : undefined,
        updateLocked,
        categories: getCardCategories(manifest, storeIntegration),
        firstSeenAt: storeIntegration.first_seen_at || null,
        updatedAt: get(storeIntegration, 'github.pushed_at') || null,
        ...getSearchFields(manifest, storeIntegration.store_slug, storeIntegration),
        ...getTransportTags(manifest)
      });
    });

    // no view filter here: the sidebar needs the whole visible catalog to
    // compute its category counts, the current view is carved out later
    return externalCards;
  }

  async getIntegrations() {
    const { user = {}, intl, category } = this.props;
    const {
      searchKeyword = '',
      orderDir = 'asc',
      origin = null,
      transports = [],
      gladysPlus = false,
      allCountries = false,
      instanceCountry = null
    } = this.state;
    const language = user.language || 'en';

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
      isNew: getFirstSeenTimestamp(card) > 0 && now - getFirstSeenTimestamp(card) < NEW_BADGE_MAX_AGE_MS,
      // folded once here, not on every keystroke. A native card is searched
      // through its translated name and description and its key; a community
      // card through everything the manifest says, plus the names of the
      // countries it is declared for ("Canada" finds the Canadian ones)
      searchIndex: buildSearchIndex({
        name: card.name,
        descriptions: card.descriptions || [card.description],
        keywords: card.keywords,
        author: card.author,
        extra: card.external ? getCountrySearchTerms(card.countries || [], language) : [card.key]
      })
    }));
    // the reference every count is compared to: the whole catalog visible to
    // this user. "42 of 810 integrations" says how much the view narrows it
    const catalogSize = catalog.length;

    const searchTokens = getSearchTokens(searchKeyword);
    const searching = searchTokens.length > 0;
    const isVirtualView = VIRTUAL_CATEGORIES.includes(category);

    // the country filter (spec §4) is a discovery tool: an integration
    // declared for other countries than the instance's is hidden from the
    // browse views, until the user asks for all countries. An installed
    // integration is never hidden — it is the user's, whatever country it
    // was published for, and disappearing from "All" would read as
    // uninstalled. Nothing is hidden when the country is unknown
    const isVisibleInCountry = integration =>
      integration.externalInstalled || isAvailableInCountry(integration.countries, instanceCountry);
    const countryScopeApplicable = !isVirtualView && !searching && !!instanceCountry;
    const countryFiltered = countryScopeApplicable && !allCountries;

    // a category earns its sidebar entry with enough integrations visible to
    // the current user (spec §5): counted on what the browse views actually
    // show, so a shelf never appears only to look empty behind the country
    // filter. Like the "Updates" entry, the category being displayed stays
    // visible below the bar, so the menu never loses the current view
    const browsableCatalog = countryFiltered ? catalog.filter(isVisibleInCountry) : catalog;
    const integrationCategories = catalogCategories.filter(
      ({ key }) =>
        key === category ||
        browsableCatalog.filter(integration => integration.categories.includes(key)).length >=
          SIDEBAR_CATEGORY_MIN_INTEGRATIONS
    );

    let selectedIntegrations = catalog;

    // Filter on the browse category of the view. Not while searching: the
    // search looks through the whole catalog, since the user knows what they
    // are looking for and a category is only a shelf to browse — the search
    // handler already left the shelf, this keeps the two consistent for a
    // hand-written URL. The virtual views are inventories (what is mine) and
    // keep their scope
    if (category && !isVirtualView && !searching) {
      selectedIntegrations = selectedIntegrations.filter(integration => integration.categories.includes(category));
    }

    // never while searching, never on the inventories (above)
    let hiddenByCountry = 0;
    if (countryFiltered) {
      const beforeCountry = selectedIntegrations.length;
      selectedIntegrations = selectedIntegrations.filter(isVisibleInCountry);
      hiddenByCountry = beforeCountry - selectedIntegrations.length;
    }

    // If we are in favorites view, only display favorites
    if (category === 'favorites') {
      selectedIntegrations = selectedIntegrations.filter(integration => integration.isFavorite);
    }

    // If we are in updates view, only display the integrations to update. One
    // just updated from its card stays, so its card can say how it went
    if (category === 'updates') {
      selectedIntegrations = selectedIntegrations.filter(
        integration => integration.updateAvailable || integration.updateState
      );
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

    // the size of an inventory (favorites, installed, to update) before the
    // search narrows it: the reference its count is compared to ("2 of 10")
    const viewSize = selectedIntegrations.length;

    // Search: every word is required, in any order, accents and case folded
    // on both sides (catalog-search.js). A keyword made of accents only folds
    // down to nothing and matches nothing, rather than the whole catalog
    const searchRanks = new Map();
    if (searchKeyword && searchKeyword.length > 0) {
      selectedIntegrations = searching
        ? selectedIntegrations.filter(integration => {
            const rank = getSearchRank(integration.searchIndex, searchTokens);
            if (rank === null) {
              return false;
            }
            searchRanks.set(integration.key, rank);
            return true;
          })
        : [];
    }

    // Sort. Ties fall back to the name, then to the stable key, so the order
    // never shuffles across catalog refreshes (spec §4)
    const byName = (a, b) => a.name.localeCompare(b.name) || a.key.localeCompare(b.key);
    let compare = byName;
    if (orderDir === 'desc') {
      compare = (a, b) => b.name.localeCompare(a.name) || b.key.localeCompare(a.key);
    } else if (orderDir === 'newest') {
      // the store index says when each community integration was first seen;
      // everything without the date (the natives, an older index) sinks below
      // as an undated block
      compare = (a, b) => getFirstSeenTimestamp(b) - getFirstSeenTimestamp(a) || byName(a, b);
    } else if (orderDir === 'updated') {
      // same block rule for the date of the last push on the repository
      compare = (a, b) => getUpdatedTimestamp(b) - getUpdatedTimestamp(a) || byName(a, b);
    }
    // a search puts the cards named after the keyword before the ones that
    // only mention it; the chosen sort then orders each group
    const compareWithRank = searching
      ? (a, b) => searchRanks.get(a.key) - searchRanks.get(b.key) || compare(a, b)
      : compare;
    selectedIntegrations.sort(compareWithRank);

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
    const filters = { category, searchKeyword, orderDir, origin, transports, gladysPlus, allCountries };
    rememberCatalogUrl(getCatalogUrl(filters));

    // a new view (category, search, sort, facets) starts back on its first
    // page of cards; the same view recomputed (a favorite toggled, a status
    // received, the store refreshed) keeps the cards already scrolled through
    const catalogView = getCatalogViewKey(filters);
    const visibleCount = catalogView === this.state.catalogView ? this.state.visibleCount : CATALOG_PAGE_SIZE;

    this.setState({
      catalogView,
      visibleCount,
      integrations: selectedIntegrations,
      // the browse views are compared to the whole catalog ("42 of 810"); an
      // inventory (favorites, installed, to update) is its own total — "3 of
      // 810" would say nothing about what is mine, "2 of 10" does
      totalSize: isVirtualView ? viewSize : catalogSize,
      // anything that narrows the catalog below its size, and that one link
      // releases at once: a shelf, a facet, a search
      hasActiveFilters:
        searching || (!!category && !isVirtualView) || origin !== null || transports.length > 0 || gladysPlus,
      hiddenByCountry,
      countryScopeApplicable,
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

  // the installed community integrations having a newer version, in the
  // alphabetical order the catalog displays them in, minus the ones whose card
  // update is already running, or already went through: a list that could not
  // be reloaded after it still carries the flag, and only a version newer than
  // the one just installed is to update again (the rule of the card footer).
  // Admin-only: the server does not send the update_available flag to the
  // other users
  getIntegrationsToUpdate() {
    if (get(this.props, 'user.role') !== USER_ROLE.ADMIN) {
      return [];
    }
    const updateStates = this.state.updateStates || {};
    const isStillToUpdate = integration => {
      const updateState = updateStates[integration.selector] || {};
      if (updateState.status === RequestStatus.Getting) {
        return false;
      }
      if (updateState.status === RequestStatus.Success) {
        return !!integration.latest_version && integration.latest_version !== updateState.version;
      }
      return true;
    };
    return (this.state.externalInstalled || [])
      .filter(integration => integration.update_available)
      .filter(isStillToUpdate)
      .map(integration => ({
        selector: integration.selector,
        name: get(integration, 'manifest.name') || integration.name || integration.selector
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // "Update all": the card update is run for each integration, one after the
  // other — one image pull and one container restart at a time, the card
  // buttons waiting for the run, and a failure does not stop the others.
  // Going through the card update keeps each card's spinner and outcome in
  // step with the run, and reloads the installed list (cards, "To update"
  // list, header counter) after every success
  updateAllIntegrations = async () => {
    if (this.state.updateAllStatus === RequestStatus.Getting) {
      return;
    }
    const integrationsToUpdate = this.getIntegrationsToUpdate();
    const total = integrationsToUpdate.length;
    if (total === 0) {
      return;
    }
    await this.setState({ updateAllStatus: RequestStatus.Getting, updateAllResult: null });
    this.getIntegrations();
    const failed = [];
    for (let index = 0; index < total && !this.unmounted; index += 1) {
      const integration = integrationsToUpdate[index];
      await this.setState({ updateAllProgress: { name: integration.name, current: index + 1, total } });
      // the outcome is the one returned by the card update, not read back
      // from the state, which preact only applies on its next render
      const outcome = await this.updateIntegration(integration.selector);
      if (outcome === RequestStatus.Error) {
        failed.push(integration);
      }
    }
    if (this.unmounted) {
      return;
    }
    await this.setState({
      updateAllStatus: failed.length > 0 ? RequestStatus.Error : RequestStatus.Success,
      updateAllProgress: null,
      updateAllResult: { total, failed }
    });
    this.getIntegrations();
  };

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

  setUpdateState = async (selector, updateState) => {
    // functional form: several cards can be updated at the same time, each
    // answer must keep the state the others left
    await this.setState(prevState => ({ updateStates: { ...prevState.updateStates, [selector]: updateState } }));
    this.getIntegrations();
  };

  updateIntegration = async selector => {
    const updateState = (this.state.updateStates || {})[selector];
    if (updateState && updateState.status === RequestStatus.Getting) {
      return null;
    }
    await this.setUpdateState(selector, { status: RequestStatus.Getting });
    try {
      const integration = await this.props.httpClient.post(`/api/v1/external_integration/${selector}/update`);
      // the reload clears the update flag of this card and feeds the header
      // counter with the new count. The spinner stays up until it has landed:
      // with the flag still set, the card would offer the update again
      await this.loadExternalIntegrations();
      await this.setUpdateState(selector, { status: RequestStatus.Success, version: integration.version });
      return RequestStatus.Success;
    } catch (e) {
      console.error(e);
      await this.setUpdateState(selector, { status: RequestStatus.Error });
      return RequestStatus.Error;
    }
  };

  // the result of an update is read on the view it ran in: carried to another
  // one, it would keep an up-to-date card in "To update" and hide the "all up
  // to date" state. An update still running, or failed, keeps its card state
  dropFinishedUpdates = async () => {
    const updateStates = this.state.updateStates || {};
    const isFinished = selector => updateStates[selector].status === RequestStatus.Success;
    if (!Object.keys(updateStates).some(isFinished)) {
      return;
    }
    await this.setState(prevState => {
      const remaining = { ...prevState.updateStates };
      Object.keys(remaining).forEach(selector => {
        if (remaining[selector].status === RequestStatus.Success) {
          delete remaining[selector];
        }
      });
      return { updateStates: remaining };
    });
    this.getIntegrations();
  };

  // more cards as the user scrolls down the list
  showMoreIntegrations = () => {
    this.setState(prevState => ({ visibleCount: prevState.visibleCount + CATALOG_PAGE_SIZE }));
  };

  search = async e => {
    const searchKeyword = e.target.value;
    await this.setState({ searchKeyword });
    // a search looks through the whole catalog: typing on a browse category
    // leaves the shelf for "All integrations", where the results are counted
    // against the whole catalog. The inventories (favorites, installed, to
    // update) keep their scope: searching "my installed Sonos" makes sense
    const leavesCategory =
      searchKeyword.length > 0 && this.props.category && !VIRTUAL_CATEGORIES.includes(this.props.category);
    if (leavesCategory) {
      // the other view is another route: the page is mounted again and the
      // field would lose the focus after this first letter
      rememberSearchFocus();
    }
    this.updateURL(leavesCategory ? { searchKeyword, category: null } : { searchKeyword });
    await this.getIntegrationsDebounced();
  };

  // the one link that releases every filter at once (shelf, facets, search),
  // the sort being a preference and not a filter. An inventory (favorites,
  // installed, to update) is not a filter either: clearing from one keeps
  // the user on it, with its search and facets released
  clearFilters = async () => {
    const category = VIRTUAL_CATEGORIES.includes(this.props.category) ? this.props.category : null;
    await this.setState({ searchKeyword: '', origin: null, transports: [], gladysPlus: false });
    this.updateURL({ searchKeyword: '', origin: null, transports: [], gladysPlus: false, category });
    await this.getIntegrations();
  };

  toggleAllCountries = async () => {
    const allCountries = !this.state.allCountries;
    await this.setState({ allCountries });
    this.updateURL({ allCountries });
    await this.getIntegrations();
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
    // until the community integrations are loaded, the catalog only holds the
    // native ones: counting or listing them alone would make Gladys look like
    // it has a few dozen integrations while hundreds are on their way
    const catalogLoading = !user.id || state.externalLoadedForUserId !== user.id;
    // same rule for the sidebar: the categories computed from the native
    // integrations alone are a partial list, entries would then be inserted
    // in the middle of it once the store lands. Only the displayed one stays
    // during the load; the others appear together with the complete catalog
    const integrationCategories = catalogLoading
      ? state.integrationCategories.filter(({ key }) => key === props.category)
      : state.integrationCategories;
    // Combine props and state for the IntegrationPage
    const combinedProps = {
      ...props,
      ...state,
      integrationCategories,
      catalogLoading,
      showInstallFromGithub,
      showStoreRefresh,
      updatableIntegrationsCount: this.getIntegrationsToUpdate().length,
      updateAllIntegrations: this.updateAllIntegrations,
      showMoreIntegrations: this.showMoreIntegrations,
      search: this.search,
      clearFilters: this.clearFilters,
      toggleAllCountries: this.toggleAllCountries,
      changeOrderDir: this.changeOrderDir,
      toggleFavorite: this.toggleFavorite,
      updateIntegration: this.updateIntegration,
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
