import { Component } from 'preact';
import uuid from 'uuid';
import get from 'get-value';
import update from 'immutability-helper';
import { connect } from 'unistore/preact';
import actions from '../../actions/edit-device';
import { RequestStatus } from '../../utils/consts';
import UpdateDevice from './UpdateDevice';

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
      />
    );
  }
}

export default connect('user,session', actions)(EditDevicePage);
