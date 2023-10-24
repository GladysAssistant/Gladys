import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import FeatureTab from './FeatureTab';
import MqttPage from '../../MqttPage';
import uuid from 'uuid';
import get from 'get-value';
import update from 'immutability-helper';
import { RequestStatus } from '../../../../../../utils/consts';
import { slugify } from '../../../../../../../../server/utils/slugify';
import withIntlAsProp from '../../../../../../utils/withIntlAsProp';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../../server/utils/constants';

class MqttDeviceSetupPage extends Component {
  selectFeature(selectedFeatureOption) {
    if (selectedFeatureOption && selectedFeatureOption.value) {
      this.setState({
        selectedFeature: selectedFeatureOption.value,
        selectedFeatureOption
      });
    } else {
      this.setState({
        selectedFeature: null,
        selectedFeatureOption: null
      });
    }
  }

  addFeature() {
    const featureData = this.state.selectedFeature.split('|');

    let defaultValues = {};

    if (featureData[1] === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
      defaultValues.min = 0;
      defaultValues.max = 1;
    }

    if (featureData[1] === DEVICE_FEATURE_TYPES.TEXT.TEXT) {
      defaultValues.min = 0;
      defaultValues.max = 0;
      defaultValues.keep_history = false;
    }

    const device = update(this.state.device, {
      features: {
        $push: [
          {
            id: uuid.v4(),
            category: featureData[0],
            external_id: 'mqtt:',
            type: featureData[1],
            read_only: true,
            has_feedback: false,
            keep_history: true,
            ...defaultValues
          }
        ]
      }
    });

    this.setState({
      device
    });
  }

  deleteFeature(featureIndex) {
    const device = update(this.state.device, {
      features: {
        $splice: [[featureIndex, 1]]
      }
    });

    this.setState({
      device
    });
  }

  updateDeviceProperty(deviceIndex, property, value) {
    let device;
    if (property === 'external_id' && !value.startsWith('mqtt:')) {
      if (value.length < 5) {
        value = 'mqtt:';
      } else {
        value = `mqtt:${value}`;
      }
    }

    device = update(this.state.device, {
      [property]: {
        $set: value
      }
    });

    if (property === 'external_id') {
      device = update(device, {
        selector: {
          $set: value
        }
      });
    }

    this.setState({
      device
    });
  }

  updateFeatureProperty(e, property, featureIndex) {
    let value = e.target.value;
    let device;
    if (property === 'external_id' && !value.startsWith('mqtt:')) {
      if (value.length < 5) {
        value = 'mqtt:';
      } else {
        value = `mqtt:${value}`;
      }
    }

    device = update(this.state.device, {
      features: {
        [featureIndex]: {
          [property]: {
            $set: value
          }
        }
      }
    });

    if (property === 'external_id') {
      device = update(device, {
        features: {
          [featureIndex]: {
            selector: {
              $set: value
            }
          }
        }
      });
    }

    this.setState({
      device
    });
  }

  async saveDevice() {
    this.setState({
      loading: true
    });
    try {
      // If we are creating a device, we check that the device doesn't already exist
      if (!this.state.device.id) {
        try {
          await this.props.httpClient.get(`/api/v1/device/${slugify(this.state.device.selector)}`);
          // if we are here, it means the device already exist
          this.setState({
            saveStatus: RequestStatus.ConflictError,
            loading: false
          });
          return;
        } catch (e) {
          // If we are here, it's ok, it means the device does not exist yet
        }
      }
      const device = await this.props.httpClient.post('/api/v1/device', this.state.device);
      this.setState({
        saveStatus: RequestStatus.Success,
        loading: false,
        device
      });
    } catch (e) {
      const status = get(e, 'response.status');
      if (status === 409) {
        this.setState({
          saveStatus: RequestStatus.ConflictError,
          loading: false
        });
      } else {
        this.setState({
          saveStatus: RequestStatus.Error,
          loading: false
        });
      }
    }
  }

  getDeviceFeaturesOptions = () => {
    const deviceFeaturesOptions = [];
    Object.keys(DEVICE_FEATURE_CATEGORIES).forEach(category => {
      const categoryValue = DEVICE_FEATURE_CATEGORIES[category];
      if (get(this.props.intl.dictionary, `deviceFeatureCategory.${categoryValue}`)) {
        const categoryFeatureTypeOptions = [];

        const types = Object.keys(get(this.props.intl.dictionary, `deviceFeatureCategory.${categoryValue}`));

        types.forEach(type => {
          const typeValue = type;
          if (
            get(this.props.intl.dictionary, `deviceFeatureCategory.${categoryValue}.${typeValue}`) &&
            typeValue !== 'shortCategoryName'
          ) {
            categoryFeatureTypeOptions.push({
              value: `${categoryValue}|${typeValue}`,
              label: get(this.props.intl.dictionary, `deviceFeatureCategory.${categoryValue}.${typeValue}`)
            });
          }
        });
        deviceFeaturesOptions.push({
          label: get(this.props.intl.dictionary, `deviceFeatureCategory.${categoryValue}.shortCategoryName`),
          options: categoryFeatureTypeOptions
        });
      }
    });
    this.setState({ deviceFeaturesOptions });
  };

  constructor(props) {
    super(props);

    this.state = {
      loading: true
    };

    this.selectFeature = this.selectFeature.bind(this);
    this.addFeature = this.addFeature.bind(this);
    this.deleteFeature = this.deleteFeature.bind(this);
    this.updateDeviceProperty = this.updateDeviceProperty.bind(this);
    this.updateFeatureProperty = this.updateFeatureProperty.bind(this);
    this.saveDevice = this.saveDevice.bind(this);
  }

  async componentWillMount() {
    this.props.getHouses();
    this.getDeviceFeaturesOptions();
    await this.props.getIntegrationByName('mqtt');

    let { deviceSelector } = this.props;
    let device;

    if (!deviceSelector) {
      device = {
        name: '',
        should_poll: false,
        external_id: 'mqtt:',
        service_id: this.props.currentIntegration.id,
        features: []
      };
    } else {
      const loadedDevice = await this.props.httpClient.get(`/api/v1/device/${deviceSelector}`);

      if (
        loadedDevice &&
        this.props.currentIntegration &&
        loadedDevice.service_id === this.props.currentIntegration.id
      ) {
        device = loadedDevice;
      }
    }

    this.setState({
      device,
      loading: false
    });
  }

  render(props, state) {
    return (
      <MqttPage>
        <FeatureTab
          {...props}
          {...state}
          selectFeature={this.selectFeature}
          addFeature={this.addFeature}
          deleteFeature={this.deleteFeature}
          updateDeviceProperty={this.updateDeviceProperty}
          updateFeatureProperty={this.updateFeatureProperty}
          saveDevice={this.saveDevice}
        />
      </MqttPage>
    );
  }
}

export default withIntlAsProp(
  connect('session,user,httpClient,houses,currentIntegration', actions)(MqttDeviceSetupPage)
);
