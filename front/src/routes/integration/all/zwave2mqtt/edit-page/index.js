import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Zwave2mqttPage from '../Zwave2mqttPage';
import UpdateDevice from '../../../../../components/device';

@connect('user,session,httpClient,currentIntegration,houses', {})
class EditZwave2mqttDevice extends Component {

  canEditCategory = (device, feature) => {
    return true;
  };

  render(props, {}) {
    return (
      <Zwave2mqttPage user={props.user}>
        <UpdateDevice
          {...props}
          canEditCategory={this.canEditCategory}
          integrationName="zwave2mqtt"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/zwave2mqtt"
        />
      </Zwave2mqttPage>
    );
  }
}

export default EditZwave2mqttDevice;
