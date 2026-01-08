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

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../../../../../server/utils/constants';

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

    if (featureData[1] === DEVICE_FEATURE_TYPES.BUTTON.PUSH) {
      defaultValues.min = 1;
      defaultValues.max = 1;
      defaultValues.read_only = false;
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
    let device = this.state.device;

    // Remove params if needed
    const paramsToDelete = [];
    device.params.forEach((param, paramIndex) => {
      if (param.name.includes(device.features[featureIndex].id)) {
        paramsToDelete.push(paramIndex);
      }
    });

    // Remove feature and params
    device = update(device, {
      features: {
        $splice: [[featureIndex, 1]]
      },
      params: {
        // The order matters, so we reverse the array to start from the end
        $splice: paramsToDelete.map(index => [index, 1]).reverse()
      }
    });

    this.setState({
      device
    });
  }

  async createEnergyConsumptionFeatures(featureIndex) {
    const parentFeature = this.state.device.features[featureIndex];
    const consumptionFeatureId = uuid.v4();
    const costFeatureId = uuid.v4();

    // Get translated names from dictionary
    const consumptionName = get(
      this.props.intl.dictionary,
      `deviceFeatureCategory.${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}.${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION}`
    );
    const costName = get(
      this.props.intl.dictionary,
      `deviceFeatureCategory.${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}.${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST}`
    );

    // Get default electric meter feature ID to set as energy_parent_id on the INDEX feature
    let defaultElectricMeterFeatureId = null;
    try {
      const response = await this.props.httpClient.get('/api/v1/energy_price/default_electric_meter_feature_id');
      defaultElectricMeterFeatureId = response.feature_id;
    } catch (e) {
      console.error('Failed to get default electric meter feature ID', e);
    }

    // Create THIRTY_MINUTES_CONSUMPTION feature with parent as energy_parent_id
    const consumptionFeature = {
      id: consumptionFeatureId,
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      external_id: `mqtt:${parentFeature.external_id.replace('mqtt:', '')}_consumption`,
      name: `${parentFeature.name} - ${consumptionName}`,
      unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 1000000000,
      energy_parent_id: parentFeature.id
    };

    // Create THIRTY_MINUTES_CONSUMPTION_COST feature with consumption as energy_parent_id
    const costFeature = {
      id: costFeatureId,
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
      external_id: `mqtt:${parentFeature.external_id.replace('mqtt:', '')}_cost`,
      name: `${parentFeature.name} - ${costName}`,
      unit: DEVICE_FEATURE_UNITS.EURO,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 1000000000,
      energy_parent_id: consumptionFeatureId
    };

    // Update parent feature with default electric meter feature ID if available
    let deviceUpdate;
    if (defaultElectricMeterFeatureId && !parentFeature.energy_parent_id) {
      deviceUpdate = update(this.state.device, {
        features: {
          [featureIndex]: {
            energy_parent_id: { $set: defaultElectricMeterFeatureId }
          },
          $push: [consumptionFeature, costFeature]
        }
      });
    } else {
      deviceUpdate = update(this.state.device, {
        features: {
          $push: [consumptionFeature, costFeature]
        }
      });
    }

    this.setState({
      device: deviceUpdate
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

  updateDeviceParam = (paramName, paramValue) => {
    let device;
    // Find if this param already exist
    const paramIndex = this.state.device.params.findIndex(p => p.name === paramName);

    // If no, create it
    if (paramIndex === -1) {
      device = update(this.state.device, {
        params: {
          $push: [
            {
              name: paramName,
              value: paramValue
            }
          ]
        }
      });
    } else {
      // If yes, update value in the param
      device = update(this.state.device, {
        params: {
          [paramIndex]: {
            value: {
              $set: paramValue
            }
          }
        }
      });
    }
    this.setState({ device });
  };

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
      // Remove params if there are params that exist with a feature that doesn't exist
      const paramsToDelete = [];

      this.state.device.params.forEach((param, paramIndex) => {
        if (
          param.name.includes('mqtt_custom_topic_feature:') ||
          param.name.includes('mqtt_custom_object_path_feature:')
        ) {
          // We verify that the feature exist
          const featureId = param.name.split(':')[1];
          const feature = this.state.device.features.find(f => f.id === featureId);
          if (!feature) {
            // If the feature doesn't exist, we delete the param
            paramsToDelete.push(paramIndex);
          }
        }
      });
      const deviceToPost = update(this.state.device, {
        params: {
          // The order matters, so we reverse the array to start from the end
          $splice: paramsToDelete.map(index => [index, 1]).reverse()
        }
      });
      const device = await this.props.httpClient.post('/api/v1/device', deviceToPost);
      this.setState({
        saveStatus: RequestStatus.Success,
        loading: false,
        device
      });
    } catch (e) {
      const status = get(e, 'response.status');
      if (status === 409) {
        await this.setState({
          saveStatus: RequestStatus.ConflictError,
          loading: false
        });
      }
      if (status === 422) {
        const properties = get(e, 'response.data.properties', []);
        await this.setState({
          saveStatus: RequestStatus.ValidationError,
          erroredAttributes: properties.map(p => p.attribute).filter(a => a !== 'selector'),
          loading: false
        });
      } else {
        await this.setState({
          saveStatus: RequestStatus.Error,
          loading: false
        });
      }
      // Scroll to top so the user sees the error
      window.scrollTo(0, 0);
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
    this.createEnergyConsumptionFeatures = this.createEnergyConsumptionFeatures.bind(this);
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
        features: [],
        params: []
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
      <MqttPage user={props.user}>
        <FeatureTab
          {...props}
          {...state}
          selectFeature={this.selectFeature}
          addFeature={this.addFeature}
          deleteFeature={this.deleteFeature}
          updateDeviceProperty={this.updateDeviceProperty}
          updateFeatureProperty={this.updateFeatureProperty}
          updateDeviceParam={this.updateDeviceParam}
          saveDevice={this.saveDevice}
          createEnergyConsumptionFeatures={this.createEnergyConsumptionFeatures}
        />
      </MqttPage>
    );
  }
}

export default withIntlAsProp(
  connect('session,user,httpClient,houses,currentIntegration', actions)(MqttDeviceSetupPage)
);
