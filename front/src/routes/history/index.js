import { Component } from 'preact';
import { connect } from 'unistore/preact';
import debounce from 'debounce';
import dayjs from 'dayjs';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';
import HistoryPage from './HistoryPage';
import { ALL_GROUPS } from './categoryGroups';

const PAGE_SIZE = 80;
const MAX_EVENTS_IN_MEMORY = 1000;
// Progressive background search: each request is bounded to a time window
// ([since, before)) so the server always answers fast; results are displayed as
// they arrive and the search keeps widening in the background (newest window
// first, geometric growth) until the page is full or history is exhausted
// (final unbounded request).
const SEARCH_WINDOWS_MONTHS = [1, 2, 4, 8, 16, 32];
// Live states are buffered and flushed at this interval instead of triggering a
// render per websocket message. A chatty installation can emit hundreds of
// states per second; without batching, each one would run a full setState +
// timeline rebuild and freeze the page.
const LIVE_FLUSH_INTERVAL_MS = 1000;
// When a filter matches a very chatty device feature, a whole page of states is
// grouped into a single timeline row, so the page never fills the viewport, the
// infinite-scroll sentinel never leaves it, and each response would immediately
// trigger the next fetch, forever. Only allow this many sentinel-triggered loads
// without a user scroll in between; past that, the "load more" button takes over.
const MAX_AUTO_LOADS_WITHOUT_SCROLL = 3;

class History extends Component {
  getRooms = async () => {
    try {
      const rooms = await this.props.httpClient.get('/api/v1/room');
      this.setState({ rooms });
    } catch (e) {
      console.error(e);
    }
  };

  // Load all devices to be able to decorate live websocket
  // events (they only contain the device feature selector)
  getDevices = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device');
      const featuresBySelector = new Map();
      devices.forEach(device => {
        device.features.forEach(feature => {
          featuresBySelector.set(feature.selector, {
            device_feature: {
              id: feature.id,
              name: feature.name,
              selector: feature.selector,
              category: feature.category,
              type: feature.type,
              unit: feature.unit,
              min: feature.min,
              max: feature.max
            },
            device: {
              name: device.name,
              selector: device.selector
            },
            room: device.room
              ? {
                  id: device.room.id,
                  name: device.room.name,
                  selector: device.room.selector
                }
              : null
          });
        });
      });
      this.featuresBySelector = featuresBySelector;
      this.setState({ featuresLoaded: true });
    } catch (e) {
      console.error(e);
    }
  };

  buildQueryParams = () => {
    const params = {
      take: PAGE_SIZE
    };
    const { selectedGroup, selectedRoomId, search } = this.state;
    if (selectedGroup) {
      const group = ALL_GROUPS.find(oneGroup => oneGroup.id === selectedGroup);
      if (group) {
        params.categories = group.categories.join(',');
      }
    }
    if (selectedRoomId) {
      params.room_id = selectedRoomId;
    }
    if (search && search.length) {
      params.search = search;
    }
    return params;
  };

  getEvents = async ({ reset = false } = {}) => {
    // Any new search (filter change, pagination) invalidates the windows still
    // being probed in the background by the previous one.
    this.searchGeneration += 1;
    const generation = this.searchGeneration;
    this.setState({ loading: true, error: false, searchedUntil: null });
    if (reset) {
      // Drop any live states buffered under the previous filter/date context.
      this.liveEventBuffer = [];
    }
    try {
      const baseParams = this.buildQueryParams();
      let before;
      let beforeId = null;
      if (!reset && this.state.events.length > 0) {
        const lastEvent = this.state.events[this.state.events.length - 1];
        before = new Date(lastEvent.created_at);
        // Compound cursor: pass the last feature id so the server can break
        // created_at ties deterministically and never skip a state.
        if (lastEvent.device_feature && lastEvent.device_feature.id) {
          beforeId = lastEvent.device_feature.id;
        }
      } else if (this.state.selectedDate) {
        // Jump to the end of the selected day, in the user's timezone
        before = dayjs(this.state.selectedDate)
          .endOf('day')
          .toDate();
      } else {
        before = new Date();
      }

      // Probe [since, before) windows from the cursor backwards, widening
      // geometrically, and render each batch as soon as it arrives. The final
      // iteration has no lower bound: it is the only potentially slow request,
      // and it only runs when every bounded window was too sparse.
      let collected = 0;
      let windowUpper = before;
      let windowUpperId = beforeId;
      let exhausted = false;
      let firstBatch = reset;
      for (let i = 0; i <= SEARCH_WINDOWS_MONTHS.length && collected < PAGE_SIZE && !exhausted; i += 1) {
        const isFinalUnbounded = i === SEARCH_WINDOWS_MONTHS.length;
        const since = isFinalUnbounded
          ? null
          : dayjs(before)
              .subtract(SEARCH_WINDOWS_MONTHS[i], 'month')
              .toDate();
        const params = { ...baseParams, take: PAGE_SIZE - collected, before: windowUpper.toISOString() };
        if (windowUpperId) {
          params.before_id = windowUpperId;
        }
        if (since) {
          params.since = since.toISOString();
        }
        // eslint-disable-next-line no-await-in-loop
        const newEvents = await this.props.httpClient.get('/api/v1/device_feature/states_history', params);
        if (generation !== this.searchGeneration) {
          return;
        }
        collected += newEvents.length;
        if (isFinalUnbounded) {
          exhausted = newEvents.length < params.take;
        }
        const resetEvents = firstBatch;
        firstBatch = false;
        this.setState(prevState => {
          let events = resetEvents ? newEvents : prevState.events.concat(newEvents);
          // Keep the array bounded during infinite scroll: drop the newest events
          // already scrolled past (array head) and keep the window being browsed.
          if (events.length > MAX_EVENTS_IN_MEMORY) {
            events = events.slice(events.length - MAX_EVENTS_IN_MEMORY);
          }
          return {
            events,
            initialized: true,
            searchedUntil: since,
            pendingLiveEvents: resetEvents ? [] : prevState.pendingLiveEvents
          };
        });
        // The next window continues strictly below this one: states exactly on
        // the boundary were already returned by this window (since is inclusive).
        if (since) {
          windowUpper = since;
          windowUpperId = null;
        }
      }
      if (generation !== this.searchGeneration) {
        return;
      }
      this.setState({ loading: false, initialized: true, hasMore: !exhausted, searchedUntil: null });
    } catch (e) {
      console.error(e);
      if (generation === this.searchGeneration) {
        this.setState({ loading: false, error: true, initialized: true, searchedUntil: null });
      }
    }
  };

  refreshEvents = () => this.getEvents({ reset: true });

  loadMore = () => {
    // Explicit user action: re-arm the auto-load budget.
    this.autoLoadsWithoutScroll = 0;
    if (!this.state.loading && this.state.hasMore) {
      this.getEvents();
    }
  };

  autoLoadMore = () => {
    if (this.autoLoadsWithoutScroll >= MAX_AUTO_LOADS_WITHOUT_SCROLL) {
      return;
    }
    if (!this.state.loading && this.state.hasMore) {
      this.autoLoadsWithoutScroll += 1;
      this.getEvents();
    }
  };

  onUserScroll = () => {
    this.autoLoadsWithoutScroll = 0;
  };

  selectGroup = groupId => {
    this.setState(
      prevState => ({
        selectedGroup: prevState.selectedGroup === groupId ? null : groupId,
        expandedGroups: {}
      }),
      this.refreshEvents
    );
  };

  selectRoom = e => {
    this.setState({ selectedRoomId: e.target.value || null, expandedGroups: {} }, this.refreshEvents);
  };

  selectDate = e => {
    this.setState(
      { selectedDate: e.target.value || null, expandedGroups: {}, pendingLiveEvents: [] },
      this.refreshEvents
    );
  };

  backToLive = () => {
    this.setState({ selectedDate: null, expandedGroups: {}, pendingLiveEvents: [] }, this.refreshEvents);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  search = e => {
    this.setState({ search: e.target.value, expandedGroups: {} });
    this.debouncedRefreshEvents();
  };

  toggleExpand = groupKey => {
    this.setState(prevState => ({
      expandedGroups: {
        ...prevState.expandedGroups,
        [groupKey]: !prevState.expandedGroups[groupKey]
      }
    }));
  };

  matchCurrentFilters = event => {
    const { selectedGroup, selectedRoomId, search } = this.state;
    if (selectedGroup) {
      const group = ALL_GROUPS.find(oneGroup => oneGroup.id === selectedGroup);
      if (group && !group.categories.includes(event.device_feature.category)) {
        return false;
      }
    }
    if (selectedRoomId && (!event.room || event.room.id !== selectedRoomId)) {
      return false;
    }
    if (search && search.length && !event.device.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  };

  onNewState = payload => {
    // When browsing a past date, don't disturb the view with live events
    if (this.state.selectedDate) {
      return;
    }
    if (!this.featuresBySelector) {
      return;
    }
    const featureMetadata = this.featuresBySelector.get(payload.device_feature_selector);
    if (!featureMetadata) {
      return;
    }
    const event = {
      value: payload.last_value,
      created_at: payload.last_value_changed,
      ...featureMetadata
    };
    if (!this.matchCurrentFilters(event)) {
      return;
    }
    // Buffer the event (newest first) and schedule a flush instead of calling
    // setState on every websocket message. This keeps the page responsive even
    // when hundreds of states are received per second.
    this.liveEventBuffer.unshift(event);
    if (this.liveEventBuffer.length > MAX_EVENTS_IN_MEMORY) {
      this.liveEventBuffer.length = MAX_EVENTS_IN_MEMORY;
    }
    this.scheduleLiveFlush();
  };

  scheduleLiveFlush = () => {
    if (this.liveFlushTimeout) {
      return;
    }
    this.liveFlushTimeout = setTimeout(this.flushLiveEvents, LIVE_FLUSH_INTERVAL_MS);
  };

  flushLiveEvents = () => {
    this.liveFlushTimeout = null;
    if (this.liveEventBuffer.length === 0) {
      return;
    }
    const buffered = this.liveEventBuffer;
    this.liveEventBuffer = [];
    // When the user scrolled down in the feed, don't insert live events
    // at the top (it would move the content under their eyes). Store them
    // and display a "new events" button instead.
    const userIsAtTop = window.scrollY < 150;
    this.setState(prevState => {
      if (userIsAtTop) {
        return {
          events: [...buffered, ...prevState.events].slice(0, MAX_EVENTS_IN_MEMORY)
        };
      }
      return {
        pendingLiveEvents: [...buffered, ...prevState.pendingLiveEvents].slice(0, MAX_EVENTS_IN_MEMORY)
      };
    });
  };

  showPendingLiveEvents = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.setState(prevState => ({
      events: [...prevState.pendingLiveEvents, ...prevState.events].slice(0, MAX_EVENTS_IN_MEMORY),
      pendingLiveEvents: []
    }));
  };

  constructor(props) {
    super(props);
    this.state = {
      events: [],
      pendingLiveEvents: [],
      rooms: [],
      expandedGroups: {},
      selectedGroup: null,
      selectedRoomId: null,
      selectedDate: null,
      search: '',
      loading: true,
      initialized: false,
      hasMore: false,
      error: false,
      featuresLoaded: false,
      searchedUntil: null
    };
    this.featuresBySelector = null;
    this.liveEventBuffer = [];
    this.liveFlushTimeout = null;
    this.autoLoadsWithoutScroll = 0;
    this.searchGeneration = 0;
    this.debouncedRefreshEvents = debounce(this.refreshEvents.bind(this), 300);
  }

  componentDidMount() {
    this.getEvents({ reset: true });
    this.getRooms();
    this.getDevices();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.onNewState);
    window.addEventListener('scroll', this.onUserScroll, { passive: true });
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.onNewState);
    window.removeEventListener('scroll', this.onUserScroll);
    if (this.liveFlushTimeout) {
      clearTimeout(this.liveFlushTimeout);
      this.liveFlushTimeout = null;
    }
  }

  render(props, state) {
    return (
      <HistoryPage
        {...state}
        searchValue={state.search}
        user={props.user}
        selectGroup={this.selectGroup}
        selectRoom={this.selectRoom}
        selectDate={this.selectDate}
        backToLive={this.backToLive}
        search={this.search}
        loadMore={this.loadMore}
        autoLoadMore={this.autoLoadMore}
        toggleExpand={this.toggleExpand}
        showPendingLiveEvents={this.showPendingLiveEvents}
        featuresBySelector={this.featuresBySelector}
      />
    );
  }
}

export default connect('httpClient,session,user', {})(History);
