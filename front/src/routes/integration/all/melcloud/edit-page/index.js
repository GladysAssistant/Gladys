import { Component } from 'preact';
import { connect } from 'unistore/preact';
import MELCloudPage from '../MELCloudPage';
import UpdateDevice from '../../../../../components/device';

class EditMELCloudDevice extends Component {
  render(props, {}) {
    return (
      <MELCloudPage user={props.user}>
        <UpdateDevice
          {...props}
          integrationName="melcloud"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/melcloud"
        />
      </MELCloudPage>
    );
  }
}

export default connect('user,session,httpClient,currentIntegration,houses', {})(EditMELCloudDevice);
