import { connect } from 'unistore/preact';
import MELCloudHomePage from '../MELCloudHomePage';
import UpdateDevice from '../../../../../components/device';

const EditMELCloudHomeDevice = props => (
  <MELCloudHomePage user={props.user}>
    <UpdateDevice
      {...props}
      integrationName="melcloud-home"
      allowModifyFeatures={false}
      previousPage="/dashboard/integration/device/melcloud-home"
    />
  </MELCloudHomePage>
);

export default connect('user,session,httpClient,currentIntegration,houses', {})(EditMELCloudHomeDevice);
