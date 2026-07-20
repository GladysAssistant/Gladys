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
  getFeatureDefaultValues,
  buildMqttExternalId,
  generateMqttExternalIdSuffix,
  normalizeMqttExternalId,
  parseMqttDeviceValidationErrors,
  clearMqttDeviceValidationError,
  isMqttCatalogFeatureVisible
} from '../utils';

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  getDefaultDeviceFeatureUnit,
  isSensorCategory
} from '../../../../../../../../server/utils/constants';

class MqttDeviceSetupPage extends Component {
  toggleFeatureCatalog() {
    this.setState({
      showFeatureCatalog: !this.state.showFeatureCatalog
    });
  }

  selectAndAddFeature(selectedFeatureOption) {
    if (!selectedFeatureOption || !selectedFeatureOption.value) {
      return;
    }

    const featureData = selectedFeatureOption.value.split('|');
    const category = featureData[0];
    const type = featureData[1];
    const defaultValues = getFeatureDefaultValues(category, type);
    const newFeatureIndex = this.state.device.features.length;

    // Sensor categories report a read-only measurement: default their features to read_only
    if (isSensorCategory(featureData[0])) {
      defaultValues.read_only = true;
    }

    // Pre-select a sensible per-type default unit when the category provides one
    // (e.g. battery-level -> percent, *-power -> watt, *-energy -> kilowatt-hour)
    const defaultUnit = getDefaultDeviceFeatureUnit(featureData[0], featureData[1]);
    if (defaultUnit) {
      defaultValues.unit = defaultUnit;
    }

    const device = update(this.state.device, {
      features: {
        $push: [
          {
            id: uuid.v4(),
            category,
            external_id: 'mqtt:',
            type,
            ...defaultValues
          }
        ]
      }
    });

    this.setState({
      device,
      showFeatureCatalog: false,
      expandedFeatureIndices: [newFeatureIndex]
    });
  }

  deleteFeature(featureIndex) {
    let device = this.state.device;
    const featureId = device.features[featureIndex].id;

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

    const customizedFeatureExternalIds = { ...this.state.customizedFeatureExternalIds };
    const featureExternalIdSuffixes = { ...this.state.featureExternalIdSuffixes };
    delete customizedFeatureExternalIds[featureId];
    delete featureExternalIdSuffixes[featureId];

    this.setState({
      device,
      customizedFeatureExternalIds,
      featureExternalIdSuffixes
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
      device: deviceUpdate,
      customizedFeatureExternalIds: {
        ...this.state.customizedFeatureExternalIds,
        [consumptionFeatureId]: true,
        [costFeatureId]: true
      }
    });
  }

  updateDeviceProperty(deviceIndex, property, value) {
    const validationErrors = clearMqttDeviceValidationError(this.state.validationErrors, property);

    if (property === 'external_id') {
      value = normalizeMqttExternalId(value);
      const device = update(this.state.device, {
        external_id: { $set: value },
        selector: { $set: value }
      });
      this.setState({
        device,
        deviceExternalIdCustomized: true,
        validationErrors
      });
      return;
    }

    if (property === 'name') {
      let device = update(this.state.device, {
        name: { $set: value }
      });

      let nextValidationErrors = validationErrors;
      const stateUpdate = { device, validationErrors: nextValidationErrors };

      if (!this.state.device.created_at && !this.state.deviceExternalIdCustomized) {
        const slug = slugify(value, false);
        if (!slug) {
          device = update(device, {
            external_id: { $set: 'mqtt:' },
            selector: { $set: 'mqtt:' }
          });
          stateUpdate.device = device;
          stateUpdate.deviceExternalIdSuffix = null;
        } else {
          let suffix = this.state.deviceExternalIdSuffix;
          if (!suffix) {
            suffix = generateMqttExternalIdSuffix();
            stateUpdate.deviceExternalIdSuffix = suffix;
          }
          const externalId = buildMqttExternalId(value, suffix);
          device = update(device, {
            external_id: { $set: externalId },
            selector: { $set: externalId }
          });
          stateUpdate.device = device;
        }
        nextValidationErrors = clearMqttDeviceValidationError(nextValidationErrors, 'external_id');
        stateUpdate.validationErrors = nextValidationErrors;
      }

      this.setState(stateUpdate);
      return;
    }

    const device = update(this.state.device, {
      [property]: {
        $set: value
      }
    });

    this.setState({
      device,
      validationErrors
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
    const feature = this.state.device.features[featureIndex];
    const validationErrors = clearMqttDeviceValidationError(this.state.validationErrors, property, featureIndex);

    if (property === 'read_only' || property === 'keep_history') {
      value = Boolean(e.target.checked);
    }

    if (property === 'external_id') {
      value = normalizeMqttExternalId(value);
      const device = update(this.state.device, {
        features: {
          [featureIndex]: {
            external_id: { $set: value },
            selector: { $set: value }
          }
        }
      });
      this.setState({
        device,
        customizedFeatureExternalIds: {
          ...this.state.customizedFeatureExternalIds,
          [feature.id]: true
        },
        validationErrors
      });
      return;
    }

    if (property === 'name') {
      let device = update(this.state.device, {
        features: {
          [featureIndex]: {
            name: { $set: value }
          }
        }
      });

      let nextValidationErrors = validationErrors;
      const stateUpdate = { device, validationErrors: nextValidationErrors };

      if (!this.state.customizedFeatureExternalIds[feature.id]) {
        const slug = slugify(value, false);
        const featureExternalIdSuffixes = { ...this.state.featureExternalIdSuffixes };

        if (!slug) {
          delete featureExternalIdSuffixes[feature.id];
          device = update(device, {
            features: {
              [featureIndex]: {
                external_id: { $set: 'mqtt:' },
                selector: { $set: 'mqtt:' }
              }
            }
          });
          stateUpdate.featureExternalIdSuffixes = featureExternalIdSuffixes;
        } else {
          let suffix = featureExternalIdSuffixes[feature.id];
          if (!suffix) {
            suffix = generateMqttExternalIdSuffix();
            featureExternalIdSuffixes[feature.id] = suffix;
          }
          const externalId = buildMqttExternalId(value, suffix);
          device = update(device, {
            features: {
              [featureIndex]: {
                external_id: { $set: externalId },
                selector: { $set: externalId }
              }
            }
          });
          stateUpdate.featureExternalIdSuffixes = featureExternalIdSuffixes;
        }
        stateUpdate.device = device;
        nextValidationErrors = clearMqttDeviceValidationError(nextValidationErrors, 'external_id', featureIndex);
        stateUpdate.validationErrors = nextValidationErrors;
      }

      this.setState(stateUpdate);
      return;
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
      device,
      validationErrors
    });
  }

  buildClientValidationErrors(device) {
    const properties = [];

    if (!device.name || device.name.trim() === '') {
      properties.push({
        message: 'name required',
        attribute: 'name',
        value: device.name || null,
        type: 'notNull Violation'
      });
    }

    if (!device.external_id || device.external_id === 'mqtt:') {
      properties.push({
        message: 'external_id required',
        attribute: 'external_id',
        value: device.external_id || null,
        type: 'notNull Violation'
      });
    }

    (device.features || []).forEach(feature => {
      if (!feature.name || feature.name.trim() === '') {
        properties.push({
          message: 'name required',
          attribute: 'name',
          value: feature.name || null,
          type: 'notNull Violation'
        });
      }

      if (!feature.external_id || feature.external_id === 'mqtt:') {
        properties.push({
          message: 'external_id required',
          attribute: 'external_id',
          value: feature.external_id || null,
          type: 'notNull Violation'
        });
      }
    });

    return properties;
  }

  async saveDevice() {
    this.setState({
      loading: true,
      validationErrors: null
    });

    const clientValidationErrors = this.buildClientValidationErrors(this.state.device);
    if (clientValidationErrors.length > 0) {
      const validationErrors = parseMqttDeviceValidationErrors(clientValidationErrors, this.state.device);
      await this.setState({
        saveStatus: RequestStatus.ValidationError,
        validationErrors,
        expandedFeatureIndices: validationErrors.expandedFeatureIndices,
        loading: false
      });
      window.scrollTo(0, 0);
      return;
    }

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
        const validationErrors = parseMqttDeviceValidationErrors(properties, this.state.device);
        await this.setState({
          saveStatus: RequestStatus.ValidationError,
          validationErrors,
          expandedFeatureIndices: validationErrors.expandedFeatureIndices,
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
            typeValue !== 'shortCategoryName' &&
            isMqttCatalogFeatureVisible(categoryValue, typeValue)
          ) {
            categoryFeatureTypeOptions.push({
              value: `${categoryValue}|${typeValue}`,
              label: get(this.props.intl.dictionary, `deviceFeatureCategory.${categoryValue}.${typeValue}`),
              category: categoryValue,
              type: typeValue
            });
          }
        });
        deviceFeaturesOptions.push({
          label: get(this.props.intl.dictionary, `deviceFeatureCategory.${categoryValue}.shortCategoryName`),
          options: categoryFeatureTypeOptions
        });
      }
    });
    this.setState({
      deviceFeaturesOptions: deviceFeaturesOptions.filter(group => group.options.length > 0)
    });
  };

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      showFeatureCatalog: false,
      expandedFeatureIndices: [],
      deviceExternalIdCustomized: false,
      deviceExternalIdSuffix: null,
      customizedFeatureExternalIds: {},
      featureExternalIdSuffixes: {},
      validationErrors: null
    };

    this.toggleFeatureCatalog = this.toggleFeatureCatalog.bind(this);
    this.selectAndAddFeature = this.selectAndAddFeature.bind(this);
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
        selector: 'mqtt:',
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

    const customizedFeatureExternalIds = {};
    if (device && device.features) {
      device.features.forEach(feature => {
        customizedFeatureExternalIds[feature.id] = true;
      });
    }

    this.setState({
      device,
      loading: false,
      deviceExternalIdCustomized: Boolean(device && device.created_at),
      customizedFeatureExternalIds
    });
  }

  render(props, state) {
    return (
      <MqttPage user={props.user}>
        <FeatureTab
          {...props}
          {...state}
          toggleFeatureCatalog={this.toggleFeatureCatalog}
          selectAndAddFeature={this.selectAndAddFeature}
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
