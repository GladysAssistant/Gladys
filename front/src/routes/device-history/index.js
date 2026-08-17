import { Component } from 'preact';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';

import DeviceHistoryPage from './DeviceHistoryPage';

const PAGE_SIZE = 50;
const DEFAULT_RANGE_IN_DAYS = 7;

class DeviceHistory extends Component {
  getDevice = async () => {
    this.setState({ loadingDevice: true, deviceError: false });
    try {
      const device = await this.props.httpClient.get(`/api/v1/device/${this.props.device_selector}`);
      // Features with history disabled have no recorded value to display or correct.
      const features = (device.features || []).filter(feature => feature.keep_history !== false);
      // getStates reads the selected feature from the state, so it can only run once the
      // new state is applied: setState is asynchronous in Preact.
      this.setState(
        {
          device,
          features,
          loadingDevice: false,
          selectedFeatureSelector: features.length > 0 ? features[0].selector : null
        },
        this.getStates
      );
    } catch (e) {
      console.error(e);
      this.setState({ loadingDevice: false, deviceError: true });
    }
  };

  getStates = async () => {
    const { selectedFeatureSelector, from, to, skip } = this.state;
    if (!selectedFeatureSelector) {
      return;
    }
    this.setState({ loading: true, error: false });
    try {
      const result = await this.props.httpClient.get(`/api/v1/device_feature/${selectedFeatureSelector}/state`, {
        from: dayjs(from)
          .startOf('day')
          .toISOString(),
        to: dayjs(to)
          .endOf('day')
          .toISOString(),
        take: PAGE_SIZE,
        skip
      });
      this.setState({
        states: result.states,
        total: result.total,
        loading: false,
        initialized: true
      });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false, error: true, initialized: true });
    }
  };

  // Any change of the query context invalidates the current page: go back to the
  // first page instead of keeping an offset that may not exist anymore.
  refreshFromFirstPage = () => {
    this.setState({ skip: 0, editingCreatedAt: null, deletingCreatedAt: null }, this.getStates);
  };

  selectFeature = e => {
    this.setState({ selectedFeatureSelector: e.target.value }, this.refreshFromFirstPage);
  };

  changeFrom = e => {
    this.setState({ from: e.target.value }, this.refreshFromFirstPage);
  };

  changeTo = e => {
    this.setState({ to: e.target.value }, this.refreshFromFirstPage);
  };

  nextPage = () => {
    this.setState(
      prevState => ({ skip: prevState.skip + PAGE_SIZE, editingCreatedAt: null, deletingCreatedAt: null }),
      this.getStates
    );
  };

  previousPage = () => {
    this.setState(
      prevState => ({ skip: Math.max(prevState.skip - PAGE_SIZE, 0), editingCreatedAt: null, deletingCreatedAt: null }),
      this.getStates
    );
  };

  startEdit = state => {
    this.setState({
      editingCreatedAt: state.created_at,
      editingValue: `${state.value}`,
      deletingCreatedAt: null,
      actionError: false
    });
  };

  changeEditValue = e => {
    this.setState({ editingValue: e.target.value });
  };

  cancelEdit = () => {
    this.setState({ editingCreatedAt: null, editingValue: '' });
  };

  saveEdit = async () => {
    const { selectedFeatureSelector, editingCreatedAt, editingValue } = this.state;
    const newValue = parseFloat(editingValue);
    if (Number.isNaN(newValue)) {
      this.setState({ actionError: true });
      return;
    }
    this.setState({ saving: true, actionError: false });
    try {
      await this.props.httpClient.patch(`/api/v1/device_feature/${selectedFeatureSelector}/state`, {
        created_at: editingCreatedAt,
        value: newValue
      });
      this.setState({ saving: false, editingCreatedAt: null, editingValue: '' }, this.getStates);
    } catch (e) {
      console.error(e);
      this.setState({ saving: false, actionError: true });
    }
  };

  askDelete = state => {
    this.setState({ deletingCreatedAt: state.created_at, editingCreatedAt: null, actionError: false });
  };

  cancelDelete = () => {
    this.setState({ deletingCreatedAt: null });
  };

  confirmDelete = async () => {
    const { selectedFeatureSelector, deletingCreatedAt } = this.state;
    this.setState({ saving: true, actionError: false });
    try {
      await this.props.httpClient.delete(
        `/api/v1/device_feature/${selectedFeatureSelector}/state?created_at=${encodeURIComponent(deletingCreatedAt)}`
      );
      this.setState({ saving: false, deletingCreatedAt: null }, this.getStates);
    } catch (e) {
      console.error(e);
      this.setState({ saving: false, actionError: true });
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      device: null,
      features: [],
      selectedFeatureSelector: null,
      from: dayjs()
        .subtract(DEFAULT_RANGE_IN_DAYS, 'day')
        .format('YYYY-MM-DD'),
      to: dayjs().format('YYYY-MM-DD'),
      states: [],
      total: 0,
      skip: 0,
      loading: false,
      loadingDevice: true,
      initialized: false,
      error: false,
      deviceError: false,
      actionError: false,
      saving: false,
      editingCreatedAt: null,
      editingValue: '',
      deletingCreatedAt: null
    };
  }

  componentDidMount() {
    this.getDevice();
  }

  render(props, state) {
    const selectedFeature = state.features.find(feature => feature.selector === state.selectedFeatureSelector) || null;
    return (
      <DeviceHistoryPage
        {...state}
        pageSize={PAGE_SIZE}
        selectedFeature={selectedFeature}
        user={props.user}
        selectFeature={this.selectFeature}
        changeFrom={this.changeFrom}
        changeTo={this.changeTo}
        nextPage={this.nextPage}
        previousPage={this.previousPage}
        startEdit={this.startEdit}
        changeEditValue={this.changeEditValue}
        cancelEdit={this.cancelEdit}
        saveEdit={this.saveEdit}
        askDelete={this.askDelete}
        cancelDelete={this.cancelDelete}
        confirmDelete={this.confirmDelete}
      />
    );
  }
}

export default connect('httpClient,user', {})(DeviceHistory);
