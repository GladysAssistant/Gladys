import { Component } from 'preact';
import { connect } from 'unistore/preact';
import debounce from 'debounce';

import DevicesPage from './DevicesPage';
import { getDeviceIntegration } from './integrationLinks';

class Devices extends Component {
  getDevices = async () => {
    this.setState({ loading: true, error: false });
    try {
      const params = { order_dir: this.state.orderDir };
      if (this.state.search && this.state.search.length) {
        // the server compares the search term to lowercased columns
        params.search = this.state.search.trim().toLowerCase();
      }
      const devices = await this.props.httpClient.get('/api/v1/device', params);
      this.setState({ devices, loading: false });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false, error: true });
    }
  };

  getRooms = async () => {
    try {
      const rooms = await this.props.httpClient.get('/api/v1/room');
      this.setState({ rooms });
    } catch (e) {
      console.error(e);
    }
  };

  search = e => {
    this.setState({ search: e.target.value });
    this.debouncedGetDevices();
  };

  changeOrderDir = e => {
    this.setState({ orderDir: e.target.value }, this.getDevices);
  };

  selectRoom = e => {
    this.setState({ selectedRoomId: e.target.value || null });
  };

  selectIntegration = e => {
    this.setState({ selectedIntegration: e.target.value || null });
  };

  matchRoomFilter = device => {
    const { selectedRoomId } = this.state;
    if (!selectedRoomId) {
      return true;
    }
    if (selectedRoomId === 'no-room') {
      return !device.room_id;
    }
    return device.room_id === selectedRoomId;
  };

  constructor(props) {
    super(props);
    this.state = {
      devices: null,
      rooms: [],
      search: '',
      orderDir: 'asc',
      selectedRoomId: null,
      selectedIntegration: null,
      loading: true,
      error: false
    };
    this.debouncedGetDevices = debounce(this.getDevices.bind(this), 300);
  }

  componentDidMount() {
    this.getDevices();
    this.getRooms();
  }

  render(props, state) {
    const devicesWithIntegration = (state.devices || []).map(device => ({
      device,
      integration: getDeviceIntegration(device)
    }));

    // The integration filter options are built from the loaded devices, so
    // the list only shows integrations the user actually has devices in
    const integrationOptions = [];
    const seenSlugs = new Set();
    devicesWithIntegration.forEach(({ integration }) => {
      if (integration && !seenSlugs.has(integration.slug)) {
        seenSlugs.add(integration.slug);
        integrationOptions.push(integration);
      }
    });
    integrationOptions.sort((a, b) => a.slug.localeCompare(b.slug));

    const filteredDevices = devicesWithIntegration
      .filter(({ device }) => this.matchRoomFilter(device))
      .filter(
        ({ integration }) =>
          !state.selectedIntegration || (integration && integration.slug === state.selectedIntegration)
      );

    return (
      <DevicesPage
        {...state}
        initialized={state.devices !== null}
        filteredDevices={filteredDevices}
        integrationOptions={integrationOptions}
        searchValue={state.search}
        search={this.search}
        changeOrderDir={this.changeOrderDir}
        selectRoom={this.selectRoom}
        selectIntegration={this.selectIntegration}
      />
    );
  }
}

export default connect('httpClient', {})(Devices);
