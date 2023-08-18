import { Component } from 'preact';
import { connect } from 'unistore/preact';
import TuyaPage from '../TuyaPage';
import UpdateDevice from '../../../../../components/device';

class EditTuyaDevice extends Component {
  render(props, {}) {
    return (
      <TuyaPage user={props.user}>
        <UpdateDevice
          {...props}
          integrationName="tuya"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/tuya"
        />
      </TuyaPage>
    );
  }
}

export default connect('user,session,httpClient,currentIntegration,houses', {})(EditTuyaDevice);
