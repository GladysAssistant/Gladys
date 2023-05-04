import { Component } from 'preact';
import { connect } from 'unistore/preact';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../../utils/consts';

import Zigbee2mqttPage from '../Zigbee2mqttPage';
import SetupTab from './SetupTab';

class Zigbee2mqttSetupPage extends Component {
  handleZ2MStatus = zigbee2mqttStatus => {
    this.setState({ zigbee2mqttStatus });
  };

  loadZ2MStatus = async () => {
    let z2mDriverPath;
    let z2mDongleName;

    try {
      let zigbeeDriverPathVariable = await this.props.httpClient.get(
        '/api/v1/service/zigbee2mqtt/variable/ZIGBEE2MQTT_DRIVER_PATH'
      );
      z2mDriverPath = zigbeeDriverPathVariable.value;
    } catch (e) {
      // Variable is not set yet
    }

    try {
      let zigbeeDongleNameVariable = await this.props.httpClient.get(
        '/api/v1/service/zigbee2mqtt/variable/ZIGBEE_DONGLE_NAME'
      );
      z2mDongleName = zigbeeDongleNameVariable.value;
    } catch (e) {
      // Variable is not set yet
    }

    try {
      const zigbee2mqttStatus = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/status');
      this.setState({
        zigbee2mqttStatus,
        configuration: { z2mDriverPath, z2mDongleName },
        loadZigbee2mqttStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error('Failed to load Zigbee2Mqtt service status', e);
      this.setState({ loadZigbee2mqttStatus: RequestStatus.Error });
    }
  };

  saveConfiguration = async configuration => {
    this.setState({
      setupZigee2mqttStatus: RequestStatus.Getting
    });
    try {
      const mapping = {
        ZIGBEE2MQTT_DRIVER_PATH: configuration.z2mDriverPath,
        ZIGBEE_DONGLE_NAME: configuration.z2mDongleName
      };
      await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/setup', mapping);
      this.setState({
        setupZigee2mqttStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        setupZigee2mqttStatus: RequestStatus.Error
      });
    }
  };

  constructor(props) {
    super(props);

    this.state = {
      zigbee2mqttStatus: {},
      loadZigbee2mqttStatus: RequestStatus.Getting
    };
  }

  componentDidMount() {
    this.loadZ2MStatus();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE, this.handleZ2MStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      this.handleZ2MStatus
    );
  }

  render(props, state) {
    return (
      <Zigbee2mqttPage user={props.user}>
        <SetupTab {...props} {...state} saveConfiguration={this.saveConfiguration} />
      </Zigbee2mqttPage>
    );
  }
}

export default connect('user,session,httpClient')(Zigbee2mqttSetupPage);
