import { Component } from 'preact';
import { connect } from 'unistore/preact';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../../utils/consts';
import config from '../../../../../config';
import { MQTT_MODE } from './constants';
import Zigbee2mqttPage from '../Zigbee2mqttPage';
import SetupTab from './SetupTab';

const VARIABLE_MAP = {
  ZIGBEE2MQTT_DRIVER_PATH: 'z2mDriverPath',
  ZIGBEE_DONGLE_NAME: 'z2mDongleName',
  Z2M_TCP_PORT: 'z2mTcpPort',
  Z2M_MQTT_MODE: 'mqttMode',
  Z2M_MQTT_URL: 'mqttUrl',
  GLADYS_MQTT_USERNAME: 'mqttUsername',
  GLADYS_MQTT_PASSWORD: 'mqttPassword'
};

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
      const savedConfig = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/setup');
      const configuration = {};
      Object.keys(VARIABLE_MAP).forEach(key => (configuration[VARIABLE_MAP[key]] = savedConfig[key]));
      this.setState({
        configuration,
        loadZigbee2mqttConfig: RequestStatus.Success
      });
      if (this.props.session.gatewayClient === undefined && configuration.mqttMode === MQTT_MODE.LOCAL) {
        const url = new URL(config.localApiUrl);
        const z2mUrl = `${url.protocol}//${url.hostname}:${configuration.z2mTcpPort || '8080'}`;
        this.setState({ z2mUrl });
      }
    } catch (e) {
      console.error('Failed to load Zigbee2Mqtt service config', e);
      this.setState({ loadZigbee2mqttConfig: RequestStatus.Error });
    }
  };

  saveConfiguration = async nextConfiguration => {
    this.setState({
      setupZigee2mqttStatus: RequestStatus.Getting
    });
    try {
      const mapping = {};
      Object.keys(VARIABLE_MAP).forEach(key => (mapping[key] = nextConfiguration[VARIABLE_MAP[key]]));
      const savedConfig = await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/setup', mapping);
      const configuration = {};
      Object.keys(VARIABLE_MAP).forEach(key => (configuration[VARIABLE_MAP[key]] = savedConfig[key]));
      this.setState({
        configuration,
        setupZigee2mqttStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        setupZigee2mqttStatus: RequestStatus.Error
      });
    }
  };

  toggleZ2M = async enable => {
    this.setState({
      toggleZigee2mqttStatus: RequestStatus.Getting
    });

    try {
      if (enable) {
        await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/connect');
      } else {
        await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/disconnect');
      }
      this.setState({
        toggleZigee2mqttStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        toggleZigee2mqttStatus: RequestStatus.Error
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
        <SetupTab {...props} {...state} saveConfiguration={this.saveConfiguration} toggleZ2M={this.toggleZ2M} />
      </Zigbee2mqttPage>
    );
  }
}

export default connect('user,session,httpClient')(Zigbee2mqttSetupPage);
