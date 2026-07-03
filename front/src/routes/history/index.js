import { Component } from 'preact';
import { connect } from 'unistore/preact';
import debounce from 'debounce';
import dayjs from 'dayjs';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';
import HistoryPage from './HistoryPage';
import { ALL_GROUPS } from './categoryGroups';

const PAGE_SIZE = 80;
const MAX_EVENTS_IN_MEMORY = 1000;

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
              name: feature.name,
              selector: feature.selector,
              category: feature.category,
              type: feature.type,
              unit: feature.unit
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
    this.setState({ loading: true, error: false });
    try {
      const params = this.buildQueryParams();
      if (!reset && this.state.events.length > 0) {
        params.before = this.state.events[this.state.events.length - 1].created_at;
      } else if (this.state.selectedDate) {
        // Jump to the end of the selected day, in the user's timezone
        params.before = dayjs(this.state.selectedDate)
          .endOf('day')
          .toISOString();
      }
      const newEvents = await this.props.httpClient.get('/api/v1/device_feature/states_history', params);
      this.setState(prevState => ({
        events: reset ? newEvents : prevState.events.concat(newEvents),
        hasMore: newEvents.length === PAGE_SIZE,
        loading: false,
        initialized: true,
        pendingLiveEvents: reset ? [] : prevState.pendingLiveEvents
      }));
    } catch (e) {
      console.error(e);
      this.setState({ loading: false, error: true, initialized: true });
    }
  };

  refreshEvents = () => this.getEvents({ reset: true });

  loadMore = () => {
    if (!this.state.loading && this.state.hasMore) {
      this.getEvents();
    }
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
    // When the user scrolled down in the feed, don't insert live events
    // at the top (it would move the content under their eyes). Store them
    // and display a "new events" button instead.
    const userIsAtTop = window.scrollY < 150;
    if (userIsAtTop) {
      this.setState(prevState => ({
        events: [event, ...prevState.events].slice(0, MAX_EVENTS_IN_MEMORY)
      }));
    } else {
      this.setState(prevState => ({
        pendingLiveEvents: [event, ...prevState.pendingLiveEvents].slice(0, MAX_EVENTS_IN_MEMORY)
      }));
    }
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
      error: false
    };
    this.featuresBySelector = null;
    this.debouncedRefreshEvents = debounce(this.refreshEvents.bind(this), 300);
  }

  componentDidMount() {
    this.getEvents({ reset: true });
    this.getRooms();
    this.getDevices();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.onNewState);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.onNewState);
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
        toggleExpand={this.toggleExpand}
        showPendingLiveEvents={this.showPendingLiveEvents}
      />
    );
  }
}

export default connect('httpClient,session,user', {})(History);
