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
    try {
      const zigbee2mqttStatus = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/status');
      this.setState({
        zigbee2mqttStatus,
        loadZigbee2mqttStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error('Failed to load Zigbee2Mqtt service status', e);
      this.setState({ loadZigbee2mqttStatus: RequestStatus.Error });
    }
  };

  loadZ2MConfig = async () => {
    try {
      const zigbee2mqttStatus = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/setup');
      const configuration = {
        z2mDriverPath: zigbee2mqttStatus.ZIGBEE2MQTT_DRIVER_PATH,
        z2mDongleName: zigbee2mqttStatus.ZIGBEE_DONGLE_NAME
      };
      this.setState({
        configuration,
        loadZigbee2mqttConfig: RequestStatus.Success
      });
    } catch (e) {
      console.error('Failed to load Zigbee2Mqtt service config', e);
      this.setState({ loadZigbee2mqttConfig: RequestStatus.Error });
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
      loadZigbee2mqttStatus: RequestStatus.Getting,
      loadZigbee2mqttConfig: RequestStatus.Getting
    };
  }

  componentDidMount() {
    this.loadZ2MStatus();
    this.loadZ2MConfig();
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
