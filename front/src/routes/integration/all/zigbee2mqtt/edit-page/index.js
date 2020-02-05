import { Component } from 'preact';
import { connect } from 'unistore/preact';
// import actions from '../actions';
import Zigbee2mqttPage from '../Zigbee2mqttPage.js';
import UpdateDevice from '../../../../../components/device';

const ZIGBEE2MQTT_PAGE_PATH = '/dashboard/integration/device/zigbee2mqtt';

@connect('user,session,httpClient,currentIntegration,houses', {})
class EditZigbee2mqttDevice extends Component {
  render(props, {}) {
    return (
      <Zigbee2mqttPage user={props.user}>
        <UpdateDevice {...props} integrationName="zigbee2mqtt" allowModifyFeatures={false} previousPage={ZIGBEE2MQTT_PAGE_PATH} />
      </Zigbee2mqttPage>
    );
  }
}

export default EditZigbee2mqttDevice;
