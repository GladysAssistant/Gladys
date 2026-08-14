import { Component } from 'preact';
import { connect } from 'unistore/preact';

import DevicesPage from './DevicesPage';
import { getDeviceIntegration } from './integrationLinks';

class Devices extends Component {
  // The endpoint returns the whole list: load it once, then search, order
  // and filter on the client. Searching client-side also matches the
  // selector displayed in the table, which the server search does not.
  getDevices = async () => {
    this.setState({ loading: true, error: false });
    try {
      const devices = await this.props.httpClient.get('/api/v1/device');
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
  };

  changeOrderDir = e => {
    this.setState({ orderDir: e.target.value });
  };

  selectRoom = e => {
    this.setState({ selectedRoomId: e.target.value || null });
  };

  selectIntegration = e => {
    this.setState({ selectedIntegration: e.target.value || null });
  };

  matchSearch = device => {
    const query = this.state.search.trim().toLowerCase();
    if (!query.length) {
      return true;
    }
    return [device.name, device.selector, device.external_id].some(
      value => value && value.toLowerCase().includes(query)
    );
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

    // The integration filter options are built from the full device list, so
    // it only shows integrations the user actually has devices in, and a
    // selected option never disappears when another filter is applied
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
      .filter(({ device }) => this.matchSearch(device))
      .filter(({ device }) => this.matchRoomFilter(device))
      .filter(
        ({ integration }) =>
          !state.selectedIntegration || (integration && integration.slug === state.selectedIntegration)
      )
      .sort((a, b) => {
        const comparison = (a.device.name || '').localeCompare(b.device.name || '', undefined, {
          sensitivity: 'base'
        });
        return state.orderDir === 'desc' ? -comparison : comparison;
      });

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
