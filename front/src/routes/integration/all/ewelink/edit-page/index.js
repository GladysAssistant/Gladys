import { connect } from 'unistore/preact';
import EweLinkPage from '../EweLinkPage';
import UpdateDevice from '../../../../../components/device';

const EditEweLinkDevice = props => (
  <EweLinkPage user={props.user}>
    <UpdateDevice
      {...props}
      integrationName="ewelink"
      allowModifyFeatures={false}
      previousPage="/dashboard/integration/device/ewelink"
    />
  </EweLinkPage>
);

export default connect('user,session,httpClient,currentIntegration,houses', {})(EditEweLinkDevice);
