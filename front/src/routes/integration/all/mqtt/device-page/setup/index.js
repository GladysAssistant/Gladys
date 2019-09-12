import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import FeatureTab from './FeatureTab';
import MqttPage from '../../MqttPage';
import integrationConfig from '../../../../../../config/integrations';
import uuid from 'uuid';
import get from 'get-value';
import update from 'immutability-helper';
import { RequestStatus } from '../../../../../../utils/consts';

@connect(
  'session,user,httpClient,houses,currentIntegration',
  actions
)
class MqttDeviceSetupPage extends Component {
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
            external_id: 'mqtt:',
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

  updateDeviceProperty(deviceIndex, property, value) {
    const device = update(this.state.device, {
      [property]: {
        $set: value
      }
    });

    this.setState({
      device
    });
  }

  updateFeatureProperty(e, property, featureIndex) {
    let value = e.target.value;
    if (property === 'external_id' && !value.startsWith('mqtt:')) {
      if (value.length < 5) {
        value = 'mqtt:';
      } else {
        value = `mqtt:${value}`;
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
    this.props.getHouses();
    await this.props.getIntegrationByName('mqtt');

    let { deviceSelector } = this.props;
    let device;

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
  }

  render(props, state) {
    return (
      <MqttPage integration={integrationConfig[props.user.language].mqtt}>
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

export default MqttDeviceSetupPage;
