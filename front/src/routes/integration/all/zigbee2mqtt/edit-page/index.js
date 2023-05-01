import { Component } from 'preact';
import { connect } from 'unistore/preact';
// import actions from '../actions';
import Zigbee2mqttPage from '../Zigbee2mqttPage.js';
import UpdateDevice from '../../../../../components/device';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants.js';

const ZIGBEE2MQTT_PAGE_PATH = '/dashboard/integration/device/zigbee2mqtt';

class EditZigbee2mqttDevice extends Component {
  canEditCategory = (device, feature) => {
    return feature.category === DEVICE_FEATURE_CATEGORIES.SHUTTER;
  };

  render(props, {}) {
    return (
      <Zigbee2mqttPage user={props.user}>
        <UpdateDevice
          {...props}
          canEditCategory={this.canEditCategory}
          integrationName="zigbee2mqtt"
          allowModifyFeatures={false}
          previousPage={ZIGBEE2MQTT_PAGE_PATH}
        />
      </Zigbee2mqttPage>
    );
  }
}

export default connect('user,session,httpClient,currentIntegration,houses', {})(EditZigbee2mqttDevice);
