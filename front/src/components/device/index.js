import { Component } from 'preact';
import uuid from 'uuid';
import get from 'get-value';
import update from 'immutability-helper';
import { connect } from 'unistore/preact';
import actions from '../../actions/edit-device';
import { RequestStatus } from '../../utils/consts';
import UpdateDevice from './UpdateDevice';
import withIntlAsProp from '../../utils/withIntlAsProp';

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../server/utils/constants';

class EditDevicePage extends Component {
  selectFeature(e) {
    this.setState({
      selectedFeature: e.target.value
    });
  }

  addFeature() {
    const featureData = this.state.selectedFeature.split('|');

    const device = update(this.state.device, {
      features: {
        $push: [
          {
            id: uuid.v4(),
            category: featureData[0],
            external_id: '',
            type: featureData[1],
            read_only: true,
            has_feedback: false,
            keep_history: true
          }
        ]
      }
    });

    this.setState({
      device,
      selectedFeature: undefined
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
      external_id: `${parentFeature.external_id}_consumption`,
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
      external_id: `${parentFeature.external_id}_cost`,
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

  updateDeviceProperty(property, value) {
    const device = update(this.state.device, {
      [property]: {
        $set: value
      }
    });

    this.setState({
      device
    });
  }

  updateFeatureProperty(featureIndex, property, value) {
    if (
      property === 'external_id' &&
      this.props.requiredExternalIdBase &&
      !value.startsWith(this.props.requiredExternalIdBase)
    ) {
      if (value.length < this.props.requiredExternalIdBase.length) {
        value = this.props.requiredExternalIdBase;
      } else {
        value = `${this.props.requiredExternalIdBase}${value}`;
      }
    }
    const device = update(this.state.device, {
      features: {
        [featureIndex]: {
          [property]: {
            $set: value
          }
        }
      }
    });

    this.setState({
      device
    });
  }

  async saveDevice() {
    this.setState({
      loading: true
    });
    try {
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
    let { deviceSelector } = this.props;
    let device;

    await Promise.all([this.props.getIntegrationByName(this.props.integrationName), this.props.getHouses()]);

    try {
      if (!deviceSelector) {
        const uniqueId = uuid.v4();
        device = {
          id: uniqueId,
          name: null,
          should_poll: false,
          external_id: uniqueId,
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
    } catch (e) {
      console.error(e);
    }
  }

  render(props, state) {
    return (
      <UpdateDevice
        {...props}
        {...state}
        selectFeature={this.selectFeature}
        addFeature={this.addFeature}
        deleteFeature={this.deleteFeature}
        updateDeviceProperty={this.updateDeviceProperty}
        updateFeatureProperty={this.updateFeatureProperty}
        saveDevice={this.saveDevice}
        createEnergyConsumptionFeatures={this.createEnergyConsumptionFeatures}
      />
    );
  }
}

export default withIntlAsProp(connect('user,session', actions)(EditDevicePage));
