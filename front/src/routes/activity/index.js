import { Component } from 'preact';
import { connect } from 'unistore/preact';
import withIntlAsProp from '../../utils/withIntlAsProp';
import ActivityPage from './ActivityPage';
import { convertGladysDateToISO8601 } from './utils';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';

const ENTRIES_PER_PAGE = 30;

const PERIOD_TO_MS = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000
};

class ActivityLog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: [],
      rooms: [],
      loading: true,
      loadingMore: false,
      isLastPage: false,
      period: '24h',
      roomSelector: '',
      mode: 'events',
      featureMap: {}
    };
  }

  getDateRange = () => {
    const { period } = this.state;
    const to = new Date();
    const from = new Date(to.getTime() - (PERIOD_TO_MS[period] || PERIOD_TO_MS['24h']));
    return { from: from.toISOString(), to: to.toISOString() };
  };

  buildQueryParams = (skip = 0) => {
    const { roomSelector, mode } = this.state;
    const { from, to } = this.getDateRange();
    const params = {
      from,
      to,
      take: ENTRIES_PER_PAGE,
      skip,
      mode
    };
    if (roomSelector) {
      params.room_selector = roomSelector;
    }
    return params;
  };

  loadFeatureMap = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', { take: 500 });
      const featureMap = {};
      devices.forEach(device => {
        (device.features || []).forEach(feature => {
          featureMap[feature.selector] = {
            ...feature,
            device_name: device.name,
            device_selector: device.selector,
            room_name: device.room ? device.room.name : null,
            room_selector: device.room ? device.room.selector : null,
            service_name: device.service ? device.service.name : null
          };
        });
      });
      this.setState({ featureMap });
    } catch (e) {
      console.error(e);
    }
  };

  loadRooms = async () => {
    try {
      const houses = await this.props.httpClient.get('/api/v1/house', { expand: 'rooms' });
      const rooms = [];
      houses.forEach(house => {
        (house.rooms || []).forEach(room => rooms.push(room));
      });
      rooms.sort((a, b) => a.name.localeCompare(b.name));
      this.setState({ rooms });
    } catch (e) {
      console.error(e);
    }
  };

  loadEntries = async (append = false) => {
    const skip = append ? this.state.entries.length : 0;
    this.setState({
      loading: !append,
      loadingMore: append
    });

    try {
      const entries = await this.props.httpClient.get('/api/v1/device_feature/activity_log', this.buildQueryParams(skip));
      entries.forEach(entry => {
        entry.created_at = convertGladysDateToISO8601(entry.created_at);
      });

      this.setState(prevState => ({
        entries: append ? [...prevState.entries, ...entries] : entries,
        isLastPage: entries.length < ENTRIES_PER_PAGE,
        loading: false,
        loadingMore: false
      }));
    } catch (e) {
      console.error(e);
      this.setState({ loading: false, loadingMore: false });
    }
  };

  handleNewState = payload => {
    const { featureMap } = this.state;
    const feature = featureMap[payload.device_feature_selector];
    if (!feature) {
      return;
    }

    const entry = {
      created_at: convertGladysDateToISO8601(payload.last_value_changed),
      value: payload.last_value,
      device_feature_selector: feature.selector,
      device_feature_name: feature.name,
      device_feature_category: feature.category,
      device_feature_type: feature.type,
      device_selector: feature.device_selector,
      device_name: feature.device_name,
      room_name: feature.room_name,
      room_selector: feature.room_selector,
      service_name: feature.service_name
    };

    this.setState(prevState => ({
      entries: [entry, ...prevState.entries].slice(0, ENTRIES_PER_PAGE * 3)
    }));
  };

  handlePeriodChange = period => {
    this.setState({ period }, () => this.loadEntries());
  };

  handleRoomChange = e => {
    this.setState({ roomSelector: e.target.value }, () => this.loadEntries());
  };

  handleModeChange = mode => {
    this.setState({ mode }, () => this.loadEntries());
  };

  handleRefresh = () => {
    this.loadEntries();
  };

  handleLoadMore = () => {
    this.loadEntries(true);
  };

  componentDidMount() {
    this.loadRooms();
    this.loadFeatureMap().then(() => this.loadEntries());
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.handleNewState);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.handleNewState);
  }

  render(props, state) {
    return (
      <ActivityPage
        entries={state.entries}
        loading={state.loading}
        loadingMore={state.loadingMore}
        isLastPage={state.isLastPage}
        period={state.period}
        roomSelector={state.roomSelector}
        rooms={state.rooms}
        mode={state.mode}
        dictionary={props.intl.dictionary}
        language={props.user.language}
        onPeriodChange={this.handlePeriodChange}
        onRoomChange={this.handleRoomChange}
        onModeChange={this.handleModeChange}
        onRefresh={this.handleRefresh}
        onLoadMore={this.handleLoadMore}
      />
    );
  }
}

export default connect('httpClient,session,user', {})(withIntlAsProp(ActivityLog));
