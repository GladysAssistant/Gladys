import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../server/utils/constants';

class CheckUserPresence extends Component {
  getOptions = async () => {
    try {
      const [users, houses, presenceDevices] = await Promise.all([
        this.props.httpClient.get('/api/v1/user'),
        this.props.httpClient.get('/api/v1/house'),
        this.props.httpClient.get('/api/v1/device', {
          device_feature_category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR
        })
      ]);
      const userOptions = users.map(user => ({
        label: user.firstname,
        value: user.selector
      }));
      const houseOptions = houses.map(house => ({
        label: house.name,
        value: house.selector
      }));
      const deviceOptions = [];
      presenceDevices.forEach(device => {
        const feature = device.features.find(f => f.category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR);
        if (feature) {
          deviceOptions.push({
            label: device.name,
            value: feature.selector
          });
        }
      });
      await this.setState({ userOptions, houseOptions, deviceOptions });
      this.refreshSelectedOptions(this.props);
    } catch (e) {
      console.error(e);
    }
  };
  handleChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', null);
    }
  };
  handleHouseChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'house', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'house', null);
    }
  };
  handleDeviceChange = selectedOptions => {
    if (selectedOptions && selectedOptions.length) {
      const deviceFeatures = selectedOptions.map(option => option.value);
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'device_features', deviceFeatures);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'device_features', []);
    }
  };
  handleChangeDuration = e => {
    let newValue = Number.isInteger(parseInt(e.target.value, 10)) ? parseInt(e.target.value, 10) : 0;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'minutes', newValue);
  };
  refreshSelectedOptions = nextProps => {
    let selectedOption = '';
    let selectedHouseOption = '';
    let selectedDeviceOptions = [];
    if (nextProps.action.user && this.state.userOptions) {
      const userOption = this.state.userOptions.find(option => option.value === nextProps.action.user);

      if (userOption) {
        selectedOption = userOption;
      }
    }
    if (nextProps.action.house && this.state.houseOptions) {
      const houseOption = this.state.houseOptions.find(option => option.value === nextProps.action.house);

      if (houseOption) {
        selectedHouseOption = houseOption;
      }
    }
    if (nextProps.action.device_features && this.state.deviceOptions) {
      const deviceOptions = [];
      nextProps.action.device_features.forEach(deviceFeature => {
        const featureOption = this.state.deviceOptions.find(option => option.value === deviceFeature);
        if (featureOption) {
          deviceOptions.push(featureOption);
        }
      });
      selectedDeviceOptions = deviceOptions;
    }
    this.setState({ selectedOption, selectedHouseOption, selectedDeviceOptions });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedOption: '',
      selectedHouseOption: '',
      selectedDeviceOption: ''
    };
  }
  componentDidMount() {
    if (!this.props.action.minutes) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'minutes', 10);
    }
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  render(props, state) {
    const {
      selectedOption,
      userOptions,
      houseOptions,
      selectedHouseOption,
      deviceOptions,
      selectedDeviceOptions
    } = state;
    return (
      <div>
        <p>
          <small>
            <Text id="editScene.actionsCard.checkUserPresence.description" />
          </small>
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.checkUserPresence.userLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={userOptions} value={selectedOption} onChange={this.handleChange} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.checkUserPresence.houseLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={houseOptions} value={selectedHouseOption} onChange={this.handleHouseChange} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.checkUserPresence.deviceLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={deviceOptions} value={selectedDeviceOptions} isMulti onChange={this.handleDeviceChange} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.checkUserPresence.minutesLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <div class="input-group mb-3">
            <Localizer>
              <input
                type="text"
                class="form-control"
                value={props.action.minutes}
                onChange={this.handleChangeDuration}
                placeholder={<Text id="editScene.actionsCard.checkUserPresence.minutesPlaceholder" />}
              />
            </Localizer>
            <div class="input-group-append">
              <span class="input-group-text" id="basic-addon2">
                <Text id="editScene.actionsCard.checkUserPresence.minutes" />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(CheckUserPresence);
