import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';

import withIntlAsProp from '../../utils/withIntlAsProp';
import DevicesPage from './DevicesPage';
import { getDeviceIntegration, disambiguateIntegrationNames } from './integrationLinks';

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

  // The states saved per device over the last hours, to flag the verbose
  // devices. It scans the history, so it is loaded next to the list and never
  // delays it: when it fails, the page simply shows no verbosity information.
  getStatesStats = async () => {
    try {
      const statesStats = await this.props.httpClient.get('/api/v1/device/states_stats');
      this.setState({ statesStats });
    } catch (e) {
      console.error(e);
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

  toggleOnlyVerbose = () => {
    this.setState(prevState => ({ onlyVerbose: !prevState.onlyVerbose }));
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
      statesStats: null,
      onlyVerbose: false,
      loading: true,
      error: false
    };
  }

  componentDidMount() {
    this.getDevices();
    this.getRooms();
    this.getStatesStats();
  }

  render(props, state) {
    const integrations = (state.devices || []).map(device => getDeviceIntegration(device));
    // names are resolved on the whole list: whether an integration needs its
    // technical identity displayed depends on the other integrations present
    const nameBySlug = disambiguateIntegrationNames(integrations);
    const statesStatsByDeviceId = new Map(
      (state.statesStats ? state.statesStats.devices : []).map(deviceStats => [deviceStats.device_id, deviceStats])
    );
    const devicesWithIntegration = (state.devices || []).map((device, index) => {
      const integration = integrations[index];
      return {
        device,
        integration: integration ? { ...integration, name: nameBySlug.get(integration.slug) } : null,
        statesStats: statesStatsByDeviceId.get(device.id) || null
      };
    });

    // Computed on the whole list, like the integration options: the banner
    // tells how much of the history the verbose devices weigh, whatever the
    // filters currently applied
    const verboseDevices = devicesWithIntegration.filter(({ statesStats }) => statesStats && statesStats.is_verbose);
    let verboseSummary = null;
    if (verboseDevices.length > 0) {
      const verboseStates = verboseDevices.reduce((sum, { statesStats }) => sum + statesStats.states, 0);
      verboseSummary = {
        count: verboseDevices.length,
        // never "0 %": a verbose device always weighs something
        percent: Math.max(1, Math.round((verboseStates * 100) / state.statesStats.total_states)),
        periodInHours: state.statesStats.period_in_hours,
        threshold: state.statesStats.verbose_device_feature_min_states
      };
    }

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
    // sorted on the label the option actually displays: a built-in integration
    // is listed under its translated title, which its service name does not
    // always match (in French, the "rtsp-camera" service reads "Caméras")
    const getOptionLabel = integration =>
      (integration.i18nKey && get(props.intl.dictionary, integration.i18nKey)) || integration.name;
    integrationOptions.sort((a, b) =>
      getOptionLabel(a).localeCompare(getOptionLabel(b), undefined, { sensitivity: 'base' })
    );
    // Built-in and community integrations live in the same list: the filter
    // groups them so a community integration named like a built-in one (or
    // like another community one) is still identifiable
    const nativeIntegrationOptions = integrationOptions.filter(integration => !integration.external);
    const communityIntegrationOptions = integrationOptions.filter(integration => integration.external);

    const filteredDevices = devicesWithIntegration
      .filter(({ device }) => this.matchSearch(device))
      .filter(({ device }) => this.matchRoomFilter(device))
      .filter(
        ({ integration }) =>
          !state.selectedIntegration || (integration && integration.slug === state.selectedIntegration)
      )
      .filter(({ statesStats }) => !state.onlyVerbose || (statesStats && statesStats.is_verbose))
      .sort((a, b) => {
        const comparison = (a.device.name || '').localeCompare(b.device.name || '', undefined, {
          sensitivity: 'base'
        });
        if (state.orderDir === 'states_desc') {
          const statesDifference =
            (b.statesStats ? b.statesStats.states : 0) - (a.statesStats ? a.statesStats.states : 0);
          return statesDifference || comparison;
        }
        return state.orderDir === 'desc' ? -comparison : comparison;
      });

    return (
      <DevicesPage
        {...state}
        initialized={state.devices !== null}
        filteredDevices={filteredDevices}
        verboseSummary={verboseSummary}
        toggleOnlyVerbose={this.toggleOnlyVerbose}
        nativeIntegrationOptions={nativeIntegrationOptions}
        communityIntegrationOptions={communityIntegrationOptions}
        searchValue={state.search}
        search={this.search}
        changeOrderDir={this.changeOrderDir}
        selectRoom={this.selectRoom}
        selectIntegration={this.selectIntegration}
      />
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(Devices));
