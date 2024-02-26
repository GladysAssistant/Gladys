import { connect } from 'unistore/preact';
import TuyaPage from '../TuyaPage';
import UpdateDevice from '../../../../../components/device';

const EditTuyaDevice = props => (
  <TuyaPage user={props.user}>
    <UpdateDevice
      {...props}
      integrationName="tuya"
      allowModifyFeatures={false}
      previousPage="/dashboard/integration/device/tuya"
    />
  </TuyaPage>
);

export default connect('user,session,httpClient,currentIntegration,houses', {})(EditTuyaDevice);
