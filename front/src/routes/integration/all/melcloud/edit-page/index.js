import { Component } from 'preact';
import { connect } from 'unistore/preact';
import MELCloudPage from '../MELCloudPage';
import UpdateDevice from '../../../../../components/device';

class EditTuyaDevice extends Component {
  render(props, {}) {
    return (
      <MELCloudPage user={props.user}>
        <UpdateDevice
          {...props}
          integrationName="tuya"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/tuya"
        />
      </MELCloudPage>
    );
  }
}

export default connect('user,session,httpClient,currentIntegration,houses', {})(EditTuyaDevice);
